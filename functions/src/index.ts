import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// Email configuration
const mailUser = "uba@vvce.ac.in"; // Replace with your email
const mailPass = "your-app-password"; // Replace with your app password

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

// Helper function to send email
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({
    from: mailUser,
    to,
    subject,
    html,
  });
}

// Types
type Role = "pdo" | "tdo" | "ddo";

interface AuthorityDocument {
  role: Role;
  email: string;
  verified: boolean;
  panchayatId?: string;
  taluk?: string;
  district?: string;
}

interface IssueDocument {
  assignedRole?: Role;
  panchayatId?: string;
  taluk?: string;
  district?: string;
  title?: string;
  status?: string;
  escalatedLevel?: number;
  villagerId?: string;
  resolveDueAt?: admin.firestore.Timestamp;
  autoEscalatedAt?: admin.firestore.Timestamp;
  manualEscalatedAt?: admin.firestore.Timestamp;
  manualEscalationUsed?: boolean;
  updatedAt?: admin.firestore.Timestamp;
  escalation?: {
    lastEscalatedTo: Role;
    history: Array<{
      type: string;
      from: Role;
      to: Role;
      at: admin.firestore.Timestamp;
      reason: string;
    }>;
  };
}

interface MailQueueDocument {
  to: string;
  subject: string;
  html: string;
  createdAt: admin.firestore.Timestamp;
  status: string;
  sentAt?: admin.firestore.Timestamp;
  error?: string;
}

// Helper functions
function nextRole(role: Role): Role | null {
  if (role === "pdo") return "tdo";
  if (role === "tdo") return "ddo";
  return null;
}

function isResolvedStatus(status: string | undefined): boolean {
  return status === "resolved" || status === "closed";
}

async function findAuthorityEmail(role: Role, panchayatId?: string, taluk?: string, district?: string): Promise<{ email: string; uid: string } | null> {
  let query: FirebaseFirestore.Query = db
    .collection("authorities")
    .where("role", "==", role)
    .where("verified", "==", true);

  if (role === "pdo") {
    query = query.where("panchayatId", "==", panchayatId || "");
  } else if (role === "tdo") {
    query = query
      .where("taluk", "==", taluk || "")
      .where("district", "==", district || "");
  } else if (role === "ddo") {
    query = query.where("district", "==", district || "");
  }

  const snap = await query.limit(1).get();
  if (snap.empty) return null;

  const doc = snap.docs[0];
  const data = doc.data() as AuthorityDocument;
  const email = data.email || "";
  if (!email) return null;

  return { email, uid: doc.id };
}

async function escalateIssue(issueId: string, type: "auto" | "manual", reason: string): Promise<void> {
  const issueRef = db.collection("issues").doc(issueId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(issueRef);
    if (!snap.exists) throw new Error("Issue not found");

    const issue = snap.data() as IssueDocument;
    if (isResolvedStatus(issue.status)) return;

    const assignedRole = issue.assignedRole || "pdo";
    const toRole = nextRole(assignedRole);
    if (!toRole) return;

    const now = admin.firestore.Timestamp.now();
    const level = issue.escalatedLevel || 0;
    const newLevel = level + 1;

    const auth = await findAuthorityEmail(toRole, issue.panchayatId, issue.taluk, issue.district);

    const historyItem = {
      type,
      from: assignedRole,
      to: toRole,
      at: now,
      reason: auth ? reason : reason + " (NO AUTHORITY EMAIL FOUND)",
    };

    if (!auth) {
      tx.update(issueRef, {
        updatedAt: now,
        escalation: {
          lastEscalatedTo: toRole,
          history: admin.firestore.FieldValue.arrayUnion(historyItem),
        },
      });
      return;
    }

    const updateData: any = {
      assignedRole: toRole,
      assignedToUid: auth.uid,
      escalatedLevel: newLevel,
      updatedAt: now,
      escalation: {
        lastEscalatedTo: toRole,
        history: admin.firestore.FieldValue.arrayUnion(historyItem),
      },
    };

    if (type === "auto") updateData.autoEscalatedAt = now;
    if (type === "manual") updateData.manualEscalatedAt = now;

    tx.update(issueRef, updateData);

    // Queue email
    const notifRef = db.collection("mail_queue").doc();
    tx.set(notifRef, {
      to: auth.email,
      subject: `Issue Escalated: ${issue.title || issueId}`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>Issue Escalation (${type.toUpperCase()})</h2>
          <p><b>Issue ID:</b> ${issueId}</p>
          <p><b>Title:</b> ${issue.title || "Untitled"}</p>
          <p><b>From:</b> ${assignedRole.toUpperCase()} → <b>To:</b> ${toRole.toUpperCase()}</p>
          <p><b>Reason:</b> ${reason}</p>
          <p><b>Panchayat:</b> ${issue.panchayatId || "-"}</p>
          <p><b>Taluk:</b> ${issue.taluk || "-"}</p>
          <p><b>District:</b> ${issue.district || "-"}</p>
        </div>
      `,
      createdAt: now,
      status: "pending",
    });
  });
}

// Export functions
export const processMailQueue = onDocumentCreated("mail_queue/{id}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const data = snap.data() as MailQueueDocument;
  const to = data.to;

  if (!to) {
    await snap.ref.update({ status: "failed", error: "Missing 'to'" });
    return;
  }

  try {
    await sendEmail(to, data.subject, data.html);
    await snap.ref.update({ 
      status: "sent", 
      sentAt: admin.firestore.Timestamp.now() 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await snap.ref.update({ 
      status: "failed", 
      error: errorMessage 
    });
  }
});

export const autoEscalateOverdueIssues = onSchedule("every 60 minutes", async () => {
  const now = admin.firestore.Timestamp.now();

  const snap = await db
    .collection("issues")
    .where("status", "not-in", ["resolved", "closed"])
    .where("resolveDueAt", "<=", now)
    .limit(50)
    .get();

  for (const doc of snap.docs) {
    const issue = doc.data() as IssueDocument;

    const lastAuto = issue.autoEscalatedAt;
    if (lastAuto) {
      const diffMs = now.toMillis() - lastAuto.toMillis();
      if (diffMs < 24 * 60 * 60 * 1000) continue;
    }

    await escalateIssue(doc.id, "auto", "Auto escalation: due date passed and not resolved.");
  }
});

export const manualEscalateIssue = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");

  const issueId = request.data?.issueId;
  if (!issueId) throw new HttpsError("invalid-argument", "Missing issueId.");

  const ref = db.collection("issues").doc(issueId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Issue not found.");

  const issue = snap.data() as IssueDocument;

  if (issue.villagerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "You are not the owner of this issue.");
  }

  if (isResolvedStatus(issue.status)) {
    throw new HttpsError("failed-precondition", "Issue already resolved/closed.");
  }

  const due = issue.resolveDueAt;
  if (!due) throw new HttpsError("failed-precondition", "Missing resolveDueAt.");

  if (admin.firestore.Timestamp.now().toMillis() < due.toMillis()) {
    throw new HttpsError("failed-precondition", "Manual escalation allowed only after due date.");
  }

  if (issue.manualEscalationUsed) {
    throw new HttpsError("failed-precondition", "Manual escalation already used.");
  }

  await db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (!s.exists) throw new HttpsError("not-found", "Issue not found.");

    const latest = s.data() as IssueDocument;
    if (latest.manualEscalationUsed) {
      throw new HttpsError("failed-precondition", "Manual escalation already used.");
    }

    tx.update(ref, {
      manualEscalationUsed: true,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  });

  await escalateIssue(issueId, "manual", "Manual escalation requested by villager after due date.");

  return { ok: true };
});

// Add this if you need a callable function to get authority email
export const getAuthorityEmailFunction = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");

  const authorityId = request.data?.authorityId;
  if (!authorityId) {
    throw new HttpsError("invalid-argument", "Authority ID is required.");
  }

  const doc = await db.collection("authorities").doc(authorityId).get();
  if (!doc.exists) {
    throw new HttpsError("not-found", "Authority not found.");
  }

  const data = doc.data() as AuthorityDocument;
  return { email: data.email };
});
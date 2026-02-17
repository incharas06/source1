"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthorityEmailFunction = exports.manualEscalateIssue = exports.autoEscalateOverdueIssues = exports.processMailQueue = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-functions/v2/firestore");
const nodemailer = __importStar(require("nodemailer"));
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
async function sendEmail(to, subject, html) {
    await transporter.sendMail({
        from: mailUser,
        to,
        subject,
        html,
    });
}
// Helper functions
function nextRole(role) {
    if (role === "pdo")
        return "tdo";
    if (role === "tdo")
        return "ddo";
    return null;
}
function isResolvedStatus(status) {
    return status === "resolved" || status === "closed";
}
async function findAuthorityEmail(role, panchayatId, taluk, district) {
    let query = db
        .collection("authorities")
        .where("role", "==", role)
        .where("verified", "==", true);
    if (role === "pdo") {
        query = query.where("panchayatId", "==", panchayatId || "");
    }
    else if (role === "tdo") {
        query = query
            .where("taluk", "==", taluk || "")
            .where("district", "==", district || "");
    }
    else if (role === "ddo") {
        query = query.where("district", "==", district || "");
    }
    const snap = await query.limit(1).get();
    if (snap.empty)
        return null;
    const doc = snap.docs[0];
    const data = doc.data();
    const email = data.email || "";
    if (!email)
        return null;
    return { email, uid: doc.id };
}
async function escalateIssue(issueId, type, reason) {
    const issueRef = db.collection("issues").doc(issueId);
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(issueRef);
        if (!snap.exists)
            throw new Error("Issue not found");
        const issue = snap.data();
        if (isResolvedStatus(issue.status))
            return;
        const assignedRole = issue.assignedRole || "pdo";
        const toRole = nextRole(assignedRole);
        if (!toRole)
            return;
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
        const updateData = {
            assignedRole: toRole,
            assignedToUid: auth.uid,
            escalatedLevel: newLevel,
            updatedAt: now,
            escalation: {
                lastEscalatedTo: toRole,
                history: admin.firestore.FieldValue.arrayUnion(historyItem),
            },
        };
        if (type === "auto")
            updateData.autoEscalatedAt = now;
        if (type === "manual")
            updateData.manualEscalatedAt = now;
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
exports.processMailQueue = (0, firestore_1.onDocumentCreated)("mail_queue/{id}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await snap.ref.update({
            status: "failed",
            error: errorMessage
        });
    }
});
exports.autoEscalateOverdueIssues = (0, scheduler_1.onSchedule)("every 60 minutes", async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db
        .collection("issues")
        .where("status", "not-in", ["resolved", "closed"])
        .where("resolveDueAt", "<=", now)
        .limit(50)
        .get();
    for (const doc of snap.docs) {
        const issue = doc.data();
        const lastAuto = issue.autoEscalatedAt;
        if (lastAuto) {
            const diffMs = now.toMillis() - lastAuto.toMillis();
            if (diffMs < 24 * 60 * 60 * 1000)
                continue;
        }
        await escalateIssue(doc.id, "auto", "Auto escalation: due date passed and not resolved.");
    }
});
exports.manualEscalateIssue = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required.");
    const issueId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.issueId;
    if (!issueId)
        throw new https_1.HttpsError("invalid-argument", "Missing issueId.");
    const ref = db.collection("issues").doc(issueId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Issue not found.");
    const issue = snap.data();
    if (issue.villagerId !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "You are not the owner of this issue.");
    }
    if (isResolvedStatus(issue.status)) {
        throw new https_1.HttpsError("failed-precondition", "Issue already resolved/closed.");
    }
    const due = issue.resolveDueAt;
    if (!due)
        throw new https_1.HttpsError("failed-precondition", "Missing resolveDueAt.");
    if (admin.firestore.Timestamp.now().toMillis() < due.toMillis()) {
        throw new https_1.HttpsError("failed-precondition", "Manual escalation allowed only after due date.");
    }
    if (issue.manualEscalationUsed) {
        throw new https_1.HttpsError("failed-precondition", "Manual escalation already used.");
    }
    await db.runTransaction(async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists)
            throw new https_1.HttpsError("not-found", "Issue not found.");
        const latest = s.data();
        if (latest.manualEscalationUsed) {
            throw new https_1.HttpsError("failed-precondition", "Manual escalation already used.");
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
exports.getAuthorityEmailFunction = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth)
        throw new https_1.HttpsError("unauthenticated", "Login required.");
    const authorityId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.authorityId;
    if (!authorityId) {
        throw new https_1.HttpsError("invalid-argument", "Authority ID is required.");
    }
    const doc = await db.collection("authorities").doc(authorityId).get();
    if (!doc.exists) {
        throw new https_1.HttpsError("not-found", "Authority not found.");
    }
    const data = doc.data();
    return { email: data.email };
});
//# sourceMappingURL=index.js.map
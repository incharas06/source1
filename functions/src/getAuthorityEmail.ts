import * as admin from "firebase-admin";

const db = admin.firestore();

interface IssueParams {
  panchayatId?: string;
  taluk?: string;
  district?: string;
}

export async function getAuthorityEmail(
  level: "vi" | "pdo" | "tdo" | "ddo",
  issue: IssueParams
): Promise<string | null> {
  let query: FirebaseFirestore.Query;

  if (level === "vi" || level === "pdo") {
    query = db
      .collection("authorities")
      .where("role", "==", level)
      .where("panchayatId", "==", issue.panchayatId);
  } else if (level === "tdo") {
    query = db
      .collection("authorities")
      .where("role", "==", "tdo")
      .where("taluk", "==", issue.taluk)
      .where("district", "==", issue.district);
  } else {
    query = db
      .collection("authorities")
      .where("role", "==", "ddo")
      .where("district", "==", issue.district);
  }

  const snap = await query.limit(1).get();
  if (snap.empty) return null;

  const data = snap.docs[0].data();
  return data.email || null;
}
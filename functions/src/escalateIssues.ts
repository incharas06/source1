import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

export const autoEscalateIssues = onSchedule(
    "every 60 minutes",
    async () => {
        const now = admin.firestore.Timestamp.now();

        const snap = await db
            .collection("issues")
            .where("status", "!=", "closed")
            .where("slaDeadline", "<=", now)
            .get();

        if (snap.empty) return;

        const batch = db.batch();

        snap.docs.forEach((doc) => {
            const issue = doc.data();

            const level = issue.currentLevel;

            let nextLevel: "pdo" | "tdo" | "ddo" | null = null;

            if (level === "vi") nextLevel = "pdo";
            else if (level === "pdo") nextLevel = "tdo";
            else if (level === "tdo") nextLevel = "ddo";

            if (!nextLevel) return;

            batch.update(doc.ref, {
                currentLevel: nextLevel,
                status: `escalated_to_${nextLevel}`,
                escalationHistory: admin.firestore.FieldValue.arrayUnion({
                    from: level,
                    to: nextLevel,
                    reason: "SLA breached",
                    at: now,
                }),
                updatedAt: now,
            });
        });

        await batch.commit();
    }
);

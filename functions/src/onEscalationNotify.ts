import { onDocumentUpdated } from "firebase-functions/v2/firestore";

export const notifyOnEscalation = onDocumentUpdated(
    "issues/{issueId}",
    async (event) => {
        const before = event.data?.before.data();
        const after = event.data?.after.data();

        if (!before || !after) return;

        if (before.currentLevel !== after.currentLevel) {
            // 🔔 send email / FCM here
            console.log(
                `Issue escalated from ${before.currentLevel} → ${after.currentLevel}`
            );
        }
    }
);

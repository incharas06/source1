// functions/src/autoEscalate.ts

import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https"; // ✅ no scheduler (works without Blaze)
import { sendMail } from "./email";
import { getAuthorityEmail } from "./getAuthorityEmail";

admin.initializeApp();
const db = admin.firestore();

const NEXT_LEVEL = {
    vi: "pdo",
    pdo: "tdo",
    tdo: "ddo",
} as const;

type Level = keyof typeof NEXT_LEVEL; // "vi" | "pdo" | "tdo"

export const runEscalationNow = onRequest(async (req, res) => {
    try {
        // Optional protection (recommended):
        // Set env: firebase functions:config:set app.escalate_token="SOME_SECRET"
        // Then deploy. Call with: ?token=SOME_SECRET
        const token =
            typeof req.query.token === "string" ? req.query.token : undefined;

        // If you don't want protection, delete this block completely.
        const cfgToken = process.env.ESCALATE_TOKEN; // or use functions config in your email.ts
        if (cfgToken && token !== cfgToken) {
            res.status(401).send("Unauthorized");
            return;
        }

        const now = admin.firestore.Timestamp.now();

        const snap = await db
            .collection("issues")
            .where("dueAt", "<", now)
            .where("escalated", "==", false)
            .limit(50) // safety limit
            .get();

        let processed = 0;

        for (const doc of snap.docs) {
            const issue = doc.data() as any;

            const current = (issue.currentLevel ?? "vi") as Level;
            const nextLevel = NEXT_LEVEL[current];
            if (!nextLevel) continue;

            // ✅ prevent double escalation (if multiple calls happen)
            // Use transaction to be safe
            await db.runTransaction(async (tx) => {
                const fresh = await tx.get(doc.ref);
                if (!fresh.exists) return;

                const freshData = fresh.data() as any;
                if (freshData?.escalated === true) return;

                tx.update(doc.ref, {
                    escalated: true,
                    escalatedAt: now,
                    escalatedTo: nextLevel,
                    currentLevel: nextLevel,
                    status: "in_progress",
                    lastActionAt: now,
                });
            });

            const email = await getAuthorityEmail(nextLevel, issue);
            if (email) {
                await sendMail(
                    email,
                    "🚨 Issue Escalated Automatically",
                    `
            <h3>Issue Escalated</h3>
            <p><b>Issue:</b> ${issue.title ?? "-"}</p>
            <p><b>Panchayat:</b> ${issue.panchayatId ?? "-"}</p>
            <p><b>Reason:</b> SLA expired</p>
            <p>Please take immediate action.</p>
          `
                );
            }

            processed++;
        }

        res.status(200).json({ ok: true, processed });
    } catch (e: any) {
        res.status(500).json({ ok: false, error: e?.message ?? String(e) });
    }
});

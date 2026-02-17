"use strict";
// functions/src/autoEscalate.ts
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
exports.runEscalationNow = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https"); // ✅ no scheduler (works without Blaze)
const email_1 = require("./email");
const getAuthorityEmail_1 = require("./getAuthorityEmail");
admin.initializeApp();
const db = admin.firestore();
const NEXT_LEVEL = {
    vi: "pdo",
    pdo: "tdo",
    tdo: "ddo",
};
exports.runEscalationNow = (0, https_1.onRequest)(async (req, res) => {
    var _a, _b, _c, _d;
    try {
        // Optional protection (recommended):
        // Set env: firebase functions:config:set app.escalate_token="SOME_SECRET"
        // Then deploy. Call with: ?token=SOME_SECRET
        const token = typeof req.query.token === "string" ? req.query.token : undefined;
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
            const issue = doc.data();
            const current = ((_a = issue.currentLevel) !== null && _a !== void 0 ? _a : "vi");
            const nextLevel = NEXT_LEVEL[current];
            if (!nextLevel)
                continue;
            // ✅ prevent double escalation (if multiple calls happen)
            // Use transaction to be safe
            await db.runTransaction(async (tx) => {
                const fresh = await tx.get(doc.ref);
                if (!fresh.exists)
                    return;
                const freshData = fresh.data();
                if ((freshData === null || freshData === void 0 ? void 0 : freshData.escalated) === true)
                    return;
                tx.update(doc.ref, {
                    escalated: true,
                    escalatedAt: now,
                    escalatedTo: nextLevel,
                    currentLevel: nextLevel,
                    status: "in_progress",
                    lastActionAt: now,
                });
            });
            const email = await (0, getAuthorityEmail_1.getAuthorityEmail)(nextLevel, issue);
            if (email) {
                await (0, email_1.sendMail)(email, "🚨 Issue Escalated Automatically", `
            <h3>Issue Escalated</h3>
            <p><b>Issue:</b> ${(_b = issue.title) !== null && _b !== void 0 ? _b : "-"}</p>
            <p><b>Panchayat:</b> ${(_c = issue.panchayatId) !== null && _c !== void 0 ? _c : "-"}</p>
            <p><b>Reason:</b> SLA expired</p>
            <p>Please take immediate action.</p>
          `);
            }
            processed++;
        }
        res.status(200).json({ ok: true, processed });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: (_d = e === null || e === void 0 ? void 0 : e.message) !== null && _d !== void 0 ? _d : String(e) });
    }
});
//# sourceMappingURL=autoEscalation.js.map
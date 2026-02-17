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
exports.autoEscalateIssues = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
exports.autoEscalateIssues = (0, scheduler_1.onSchedule)("every 60 minutes", async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db
        .collection("issues")
        .where("status", "!=", "closed")
        .where("slaDeadline", "<=", now)
        .get();
    if (snap.empty)
        return;
    const batch = db.batch();
    snap.docs.forEach((doc) => {
        const issue = doc.data();
        const level = issue.currentLevel;
        let nextLevel = null;
        if (level === "vi")
            nextLevel = "pdo";
        else if (level === "pdo")
            nextLevel = "tdo";
        else if (level === "tdo")
            nextLevel = "ddo";
        if (!nextLevel)
            return;
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
});
//# sourceMappingURL=escalateIssues.js.map
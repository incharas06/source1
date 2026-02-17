"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOnEscalation = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
exports.notifyOnEscalation = (0, firestore_1.onDocumentUpdated)("issues/{issueId}", async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    if (before.currentLevel !== after.currentLevel) {
        // 🔔 send email / FCM here
        console.log(`Issue escalated from ${before.currentLevel} → ${after.currentLevel}`);
    }
});
//# sourceMappingURL=onEscalationNotify.js.map
import {
    collection,
    getCountFromServer,
    query,
    where,
    QueryConstraint,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export type DashboardStats = {
    totalIssues: number;
    pending: number;
    inProgress: number;
    resolved: number;
    overdue: number;

    // optional legacy statuses
    openIssues: number;
    escalated: number;

    villagers: number;
    authorities: number;

    pendingPDO: number;
    pendingVillageIncharge: number;
    pendingTDO: number;
    pendingDDO: number;
};

async function countDocs(colName: string, constraints: QueryConstraint[] = []) {
    const q = constraints.length
        ? query(collection(db, colName), ...constraints)
        : query(collection(db, colName));

    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
}

export class DashboardService {
    static async getAdminDashboardStats(): Promise<DashboardStats> {
        // ✅ IMPORTANT:
        // - villagers are stored in "villagers"
        // - authorities are stored in "authorities"
        // - issues are stored in "issues"

        const [
            totalIssues,

            pending,
            inProgress,
            resolved,
            overdue,

            // legacy statuses (if you still have them in old docs)
            openIssues,
            escalated,

            villagers,
            authorities,

            pendingPDO,
            pendingVillageIncharge,
            pendingTDO,
            pendingDDO,
        ] = await Promise.all([
            // issues
            countDocs("issues"),

            countDocs("issues", [where("status", "==", "pending")]),
            countDocs("issues", [where("status", "==", "in_progress")]),
            countDocs("issues", [where("status", "==", "resolved")]),
            countDocs("issues", [where("status", "==", "overdue")]),

            // legacy (safe even if 0)
            countDocs("issues", [where("status", "==", "open")]),
            countDocs("issues", [where("status", "==", "escalated")]),

            // ✅ FIX: no more "users"
            countDocs("villagers"),
            countDocs("authorities"),

            // pending authorities
            // (client registration sets verified:false, verification.status:"pending")
            countDocs("authorities", [
                where("role", "==", "pdo"),
                where("verified", "==", false),
            ]),
            countDocs("authorities", [
                where("role", "==", "village_incharge"),
                where("verified", "==", false),
            ]),
            countDocs("authorities", [
                where("role", "==", "tdo"),
                where("verified", "==", false),
            ]),
            countDocs("authorities", [
                where("role", "==", "ddo"),
                where("verified", "==", false),
            ]),
        ]);

        return {
            totalIssues,

            pending,
            inProgress,
            resolved,
            overdue,

            openIssues,
            escalated,

            villagers,
            authorities,

            pendingPDO,
            pendingVillageIncharge,
            pendingTDO,
            pendingDDO,
        };
    }
}

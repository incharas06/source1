// services/firebase/villagerService.ts
import { db } from "../../lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export const VillagerService = {
    async createVillagerProfile(v: {
        uid: string;
        name: string;
        email: string;
        mobile: string;
        district: string;
        taluk: string;
        gramPanchayat: string;
        village: string;
        panchayatId: string; // MUST be non-empty
        aadhaarLast4?: string;
    }) {
        // ✅ 1) villagers/{uid}
        await setDoc(doc(db, "villagers", v.uid), {
            uid: v.uid,
            role: "villager",
            name: v.name,
            email: v.email,
            mobile: v.mobile,
            district: v.district,
            taluk: v.taluk,
            gramPanchayat: v.gramPanchayat,
            village: v.village,
            panchayatId: v.panchayatId,     // ✅ required for VI scope
            aadhaarLast4: v.aadhaarLast4 || null,

            verified: false,               // ✅ pending
            status: "pending",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // ✅ 2) users/{uid} (optional but your status page uses it)
        await setDoc(doc(db, "users", v.uid), {
            uid: v.uid,
            role: "villager",
            name: v.name,
            email: v.email,
            verified: false,
            status: "pending",
            panchayatId: v.panchayatId,
            district: v.district,
            taluk: v.taluk,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    },
};

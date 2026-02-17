// services/firebase/authorityService.ts
import { db } from "../../lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

type CreateAuthorityInput = {
    uid: string;
    role: "pdo" | "village_incharge" | "tdo" | "ddo";
    name: string;
    email: string;
    mobile: string;
    aadhaarLast4: string;
    officeAddress: string;

    district: string;
    taluk: string | null;
    gramPanchayat: string | null;
    village: string | null;

    panchayatId: string | null;
};

export const AuthorityService = {
    async createAuthorityProfile(input: CreateAuthorityInput) {
        // IMPORTANT:
        // - Never set verified:true from client
        // - Always create in "pending" state
        // - Use setDoc on authorities/{uid}

        const ref = doc(db, "authorities", input.uid);

        await setDoc(ref, {
            uid: input.uid,
            role: input.role,

            name: input.name,
            email: input.email,
            mobile: input.mobile,

            // store only last4
            aadhaarLast4: input.aadhaarLast4,

            officeAddress: input.officeAddress,

            district: input.district,
            taluk: input.taluk,
            gramPanchayat: input.gramPanchayat,
            village: input.village,
            panchayatId: input.panchayatId,

            // verification fields
            verified: false,
            verification: {
                status: "pending",
                requestedAt: serverTimestamp(),
                verifiedAt: null,
                verifiedBy: null,
            },

            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    },
};

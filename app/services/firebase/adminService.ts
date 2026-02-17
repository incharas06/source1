import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

export type AdminUser = {
    id: string;
    email: string;
    name: string;
    role: "super_admin";
    isActive: boolean;
};

function niceError(msg: string) {
    return new Error(msg);
}

export class AdminService {
    static async loginSuperAdmin(email: string, password: string) {
        // 1) Firebase Auth sign-in
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        // 2) Admin doc must exist
        const adminRef = doc(db, "admins", user.uid);
        const snap = await getDoc(adminRef);

        if (!snap.exists()) {
            await signOut(auth);
            throw niceError("Admin account not found.");
        }

        const data = snap.data() as any;

        // 3) Must be active super admin
        if (data?.role !== "super_admin") {
            await signOut(auth);
            throw niceError("Not authorized for admin access.");
        }
        if (data?.isActive === false) {
            await signOut(auth);
            throw niceError("This admin account is deactivated.");
        }

        // 4) Update last login (optional)
        try {
            await updateDoc(adminRef, { lastLogin: serverTimestamp() });
        } catch {
            // ignore (not critical)
        }

        const admin: AdminUser = {
            id: user.uid,
            email: data.email || user.email || "",
            name: data.name || "Super Admin",
            role: "super_admin",
            isActive: data.isActive ?? true,
        };

        return { admin, user };
    }

    static async logout() {
        await signOut(auth);
    }

    static async getCurrentAdmin() {
        const user = auth.currentUser;
        if (!user) return null;

        const adminRef = doc(db, "admins", user.uid);
        const snap = await getDoc(adminRef);

        if (!snap.exists()) {
            // If user is logged in but admin doc doesn't exist => force logout for safety
            try {
                await signOut(auth);
            } catch { }
            return null;
        }

        const data = snap.data() as any;

        if (data?.role !== "super_admin" || data?.isActive === false) {
            try {
                await signOut(auth);
            } catch { }
            return null;
        }

        const admin: AdminUser = {
            id: user.uid,
            email: data.email || user.email || "",
            name: data.name || "Super Admin",
            role: "super_admin",
            isActive: data.isActive ?? true,
        };

        return { admin, user };
    }
}

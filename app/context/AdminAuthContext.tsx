"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { AdminService, AdminUser } from "../services/firebase/adminService";

type AdminAuthContextType = {
    admin: AdminUser | null;
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
    undefined
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // ✅ single loading flag that covers initial boot + actions
    const [loading, setLoading] = useState(true);

    // ✅ prevent setState after unmount
    const alive = useRef(true);

    // ✅ prevent stale async updates (auth switch / fast refresh / re-login)
    const authSeq = useRef(0);

    useEffect(() => {
        alive.current = true;

        const unsub = onAuthStateChanged(auth, async (u) => {
            const seq = ++authSeq.current;

            try {
                if (!alive.current) return;

                // start resolving this auth state
                setLoading(true);

                if (!u) {
                    if (!alive.current || authSeq.current !== seq) return;
                    setAdmin(null);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // ✅ only allow if this firebase user is a valid admin (exists in admins collection)
                const session = await AdminService.getCurrentAdmin();

                if (!alive.current || authSeq.current !== seq) return;

                if (!session) {
                    setAdmin(null);
                    setUser(null);
                    setLoading(false);
                    return;
                }

                setAdmin(session.admin);
                setUser(session.user);
                setLoading(false);
            } catch {
                if (!alive.current || authSeq.current !== seq) return;
                setAdmin(null);
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            alive.current = false;
            unsub();
        };
    }, []);

    const login = async (email: string, password: string) => {
        // Keep UI responsive but avoid flicker:
        setLoading(true);
        try {
            const res = await AdminService.loginSuperAdmin(email, password);
            // Auth listener will also run; but we set immediately for fast UI
            setAdmin(res.admin);
            setUser(res.user);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await AdminService.logout();
            setAdmin(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminAuthContext.Provider value={{ admin, user, loading, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
    return ctx;
}

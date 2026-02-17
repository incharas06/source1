"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";

export type AuthorityRole = "pdo" | "village_incharge" | "tdo" | "ddo";
export type GateResult =
    | { state: "loading" }
    | { state: "no-user" }
    | { state: "no-profile" }
    | { state: "pending"; role: AuthorityRole }
    | { state: "verified"; role: AuthorityRole };

export function useAuthorityGate(): GateResult {
    const [res, setRes] = useState<GateResult>({ state: "loading" });

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) {
                setRes({ state: "no-user" });
                return;
            }

            try {
                const snap = await getDoc(doc(db, "authorities", u.uid));
                if (!snap.exists()) {
                    setRes({ state: "no-profile" });
                    return;
                }

                const data: any = snap.data();
                const role = (data?.role || "pdo") as AuthorityRole;

                const verified =
                    data?.verified === true || data?.verification?.status === "verified";

                setRes(verified ? { state: "verified", role } : { state: "pending", role });
            } catch {
                // If firestore temporarily fails, DON'T redirect loop
                setRes({ state: "pending", role: "pdo" });
            }
        });

        return () => unsub();
    }, []);

    return res;
}

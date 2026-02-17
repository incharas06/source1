"use client";

import { useEffect, useState } from "react";
import { JSX } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

export function AuthGate({
    children,
    fallback,
}: {
    children: (user: User) => JSX.Element;
    fallback?: JSX.Element;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) {
        return (
            fallback || (
                <div className="min-h-screen flex items-center justify-center">
                    Loading…
                </div>
            )
        );
    }

    if (!user) {
        return null; // IMPORTANT: do NOT redirect here
    }

    return children(user);
}

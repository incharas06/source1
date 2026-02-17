"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import Screen from "../../components/Screen";
import { useTranslations } from "next-intl";

type Props = {
    requiredRole: "pdo" | "vi" | "tdo" | "ddo";
    children: React.ReactNode;
};

export default function AuthorityGuard({ requiredRole, children }: Props) {
    const t = useTranslations("Authority");
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        setErr("");
        setLoading(true);

        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.replace(`/${locale}/authority/login`);
                return;
            }

            try {
                const snap = await getDoc(doc(db, "authorities", user.uid));

                if (!snap.exists()) {
                    router.replace(`/${locale}/authority/register`);
                    return;
                }

                const a = snap.data() as any;

                const verified =
                    a?.verified === true || a?.verification?.status === "verified";

                if (!verified) {
                    router.replace(`/${locale}/authority/status`);
                    return;
                }

                // ✅ Firestore stores role as "village_incharge"
                // ✅ UI routes use "vi"
                const role = a?.role === "village_incharge" ? "vi" : a?.role;

                if (role !== requiredRole) {
                    setErr(t("forbidden"));
                    setLoading(false);
                    return;
                }

                setLoading(false);
            } catch (e: any) {
                setErr(e?.message || "Failed to load authority profile.");
                setLoading(false);
            }
        });

        return () => unsub();
    }, [router, locale, requiredRole, t]);

    if (loading) {
        return (
            <Screen center>
                <div className="w-full max-w-sm px-4 flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
                    <div className="mt-3 text-green-900 font-semibold text-sm sm:text-base">
                        {t("loading")}
                    </div>
                    <div className="mt-2 text-green-800/70 text-xs text-center">
                        Please wait…
                    </div>
                </div>
            </Screen>
        );
    }

    if (err) {
        return (
            <Screen padded>
                <div className="w-full max-w-sm sm:max-w-md mx-auto px-3">
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {err}
                    </div>

                    <button
                        onClick={() => router.replace(`/${locale}/authority/login`)}
                        className="mt-4 w-full rounded-2xl bg-green-700 active:bg-green-800 text-white font-extrabold py-3 text-sm sm:text-base"
                    >
                        {t("backLogin")}
                    </button>
                </div>
            </Screen>
        );
    }

    return <>{children}</>;
}

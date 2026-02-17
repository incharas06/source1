"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import Screen from "../../components/Screen";

type Authority = {
    id: string;
    name?: string;
    email?: string;
    mobile?: string;
    district?: string;
    taluk?: string;
    gramPanchayat?: string;
    village?: string;
    panchayatId?: string;
    aadhaarLast4?: string;
    verification?: { status?: string };
    verified?: boolean;
    role?: string;
};

export default function VerifyRoleList({
    role,
    routeTitleKey,
}: {
    role: "pdo" | "village_incharge" | "tdo" | "ddo";
    routeTitleKey: "pdo" | "vic" | "tdo" | "ddo";
}) {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = params?.locale || "en";

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [rows, setRows] = useState<Authority[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // Email sending function
    const sendEmail = async (to: string, template: 'approval' | 'rejection', data: any) => {
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: to,
                    subject: template === 'approval' 
                        ? `Account Verified - ${data.role.toUpperCase()} Registration` 
                        : `Registration Rejected - ${data.role.toUpperCase()} Application`,
                    template: template,
                    data: data
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send email');
            }

            return await response.json();
        } catch (error) {
            console.error(`Error sending ${template} email:`, error);
            throw error;
        }
    };

    const t = useMemo(() => {
        const L: any = {
            en: {
                titles: {
                    pdo: "Verify PDO Requests",
                    vic: "Verify Village In-charge Requests",
                    tdo: "Verify TDO Requests",
                    ddo: "Verify DDO Requests",
                },
                subtitle: "Approve / Reject authority registrations",
                back: "Back",
                empty: "No pending requests.",
                approve: "Approve",
                reject: "Reject",
                status: "Status",
                rejectModal: {
                    title: "Reject Registration",
                    reason: "Reason for rejection",
                    reasonPlaceholder: "Enter reason for rejection...",
                    cancel: "Cancel",
                    confirm: "Confirm Rejection",
                    required: "Please provide a reason for rejection"
                },
                success: {
                    approved: "Authority approved successfully. Email sent.",
                    approvedNoEmail: "Authority approved, but email failed to send.",
                    rejected: "Authority rejected successfully. Email sent.",
                    rejectedNoEmail: "Authority rejected, but email failed to send."
                },
                emailError: "Note: Email notification failed to send"
            },
            kn: {
                titles: {
                    pdo: "PDO ಪರಿಶೀಲನೆ",
                    vic: "ಗ್ರಾಮ ಇನ್‌ಚಾರ್ಜ್ ಪರಿಶೀಲನೆ",
                    tdo: "TDO ಪರಿಶೀಲನೆ",
                    ddo: "DDO ಪರಿಶೀಲನೆ",
                },
                subtitle: "ಅನುಮೋದಿಸಿ / ತಿರಸ್ಕರಿಸಿ",
                back: "ಹಿಂದೆ",
                empty: "ಬಾಕಿ ಇರುವ ವಿನಂತಿಗಳು ಇಲ್ಲ.",
                approve: "ಅನುಮೋದಿಸಿ",
                reject: "ತಿರಸ್ಕರಿಸಿ",
                status: "ಸ್ಥಿತಿ",
                rejectModal: {
                    title: "ನೋಂದಣಿ ತಿರಸ್ಕರಿಸಿ",
                    reason: "ತಿರಸ್ಕರಿಸಲು ಕಾರಣ",
                    reasonPlaceholder: "ತಿರಸ್ಕರಿಸಲು ಕಾರಣವನ್ನು ನಮೂದಿಸಿ...",
                    cancel: "ರದ್ದುಮಾಡು",
                    confirm: "ತಿರಸ್ಕರಿಸಲು ಖಚಿತಪಡಿಸಿ",
                    required: "ದಯವಿಟ್ಟು ತಿರಸ್ಕರಿಸಲು ಕಾರಣವನ್ನು ನೀಡಿ"
                },
                success: {
                    approved: "ಅಧಿಕಾರಿ ಅನುಮೋದಿಸಲ್ಪಟ್ಟಿದೆ. ಇಮೇಲ್ ಕಳುಹಿಸಲಾಗಿದೆ.",
                    approvedNoEmail: "ಅಧಿಕಾರಿ ಅನುಮೋದಿಸಲ್ಪಟ್ಟಿದೆ, ಆದರೆ ಇಮೇಲ್ ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ.",
                    rejected: "ಅಧಿಕಾರಿ ತಿರಸ್ಕರಿಸಲ್ಪಟ್ಟಿದೆ. ಇಮೇಲ್ ಕಳುಹಿಸಲಾಗಿದೆ.",
                    rejectedNoEmail: "ಅಧಿಕಾರಿ ತಿರಸ್ಕರಿಸಲ್ಪಟ್ಟಿದೆ, ಆದರೆ ಇಮೇಲ್ ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ."
                },
                emailError: "ಗಮನಿಸಿ: ಇಮೇಲ್ ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ"
            },
            hi: {
                titles: {
                    pdo: "PDO वेरिफिकेशन",
                    vic: "Village In-charge वेरिफिकेशन",
                    tdo: "TDO वेरिफिकेशन",
                    ddo: "DDO वेरिफिकेशन",
                },
                subtitle: "अनुरोध Approve / Reject करें",
                back: "वापस",
                empty: "कोई pending request नहीं है।",
                approve: "अनुमोदित करें",
                reject: "अस्वीकार करें",
                status: "स्थिति",
                rejectModal: {
                    title: "पंजीकरण अस्वीकार करें",
                    reason: "अस्वीकरण का कारण",
                    reasonPlaceholder: "अस्वीकरण का कारण दर्ज करें...",
                    cancel: "रद्द करें",
                    confirm: "अस्वीकरण की पुष्टि करें",
                    required: "कृपया अस्वीकरण का कारण प्रदान करें"
                },
                success: {
                    approved: "अधिकारी को अनुमोदित किया गया। ईमेल भेजा गया।",
                    approvedNoEmail: "अधिकारी को अनुमोदित किया गया, लेकिन ईमेल भेजने में विफल रहा।",
                    rejected: "अधिकारी को अस्वीकृत किया गया। ईमेल भेजा गया।",
                    rejectedNoEmail: "अधिकारी को अस्वीकृत किया गया, लेकिन ईमेल भेजने में विफल रहा।"
                },
                emailError: "नोट: ईमेल सूचना भेजने में विफल"
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    useEffect(() => {
        const load = async () => {
            setErr("");
            setLoading(true);

            try {
                if (!auth.currentUser) {
                    router.replace(`/${locale}/admin/login`);
                    return;
                }

                const qy = query(
                    collection(db, "authorities"),
                    where("role", "==", role),
                    where("verification.status", "==", "pending")
                );

                const snap = await getDocs(qy);
                setRows(
                    snap.docs.map((d) => ({
                        id: d.id,
                        ...(d.data() as any),
                    }))
                );
            } catch (e: any) {
                setErr(e?.message || "Failed to load.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [router, locale, role]);

    const approveAuthority = async (id: string) => {
        setErr("");
        setBusyId(id);
        
        // Find the authority being approved
        const authority = rows.find(a => a.id === id);
        if (!authority) {
            setErr("Authority not found.");
            setBusyId(null);
            return;
        }

        try {
            // Update Firestore document
            await updateDoc(doc(db, "authorities", id), {
                verified: true,
                "verification.status": "verified",
                status: "active",
                verifiedAt: serverTimestamp(),
                verifiedBy: auth.currentUser?.uid || "unknown",
                updatedAt: serverTimestamp(),
            });
            
            // Try to send approval email
            let emailSent = false;
            if (authority.email) {
                try {
                    await sendEmail(authority.email, 'approval', {
                        name: authority.name || 'Authority User',
                        role: authority.role || role,
                        userId: authority.id
                    });
                    emailSent = true;
                } catch (emailError) {
                    console.error("Approval email failed:", emailError);
                }
            }
            
            // Show success message based on email status
            setErr(emailSent ? t.success.approved : t.success.approvedNoEmail);
            setTimeout(() => setErr(""), 3000);
            
            // Remove from list
            setRows((prev) => prev.filter((x) => x.id !== id));
        } catch (e: any) {
            setErr(e?.message || "Approval failed.");
        } finally {
            setBusyId(null);
        }
    };

    const rejectAuthority = async (id: string, reason: string) => {
        setErr("");
        setBusyId(id);
        
        // Find the authority being rejected
        const authority = rows.find(a => a.id === id);
        if (!authority) {
            setErr("Authority not found.");
            setBusyId(null);
            return;
        }

        try {
            // Update Firestore document
            await updateDoc(doc(db, "authorities", id), {
                verified: false,
                "verification.status": "rejected",
                status: "rejected",
                rejectedReason: reason,
                verifiedAt: serverTimestamp(),
                verifiedBy: auth.currentUser?.uid || "unknown",
                updatedAt: serverTimestamp(),
            });
            
            // Try to send rejection email
            let emailSent = false;
            if (authority.email) {
                try {
                    await sendEmail(authority.email, 'rejection', {
                        name: authority.name || 'Authority User',
                        role: authority.role || role,
                        reason: reason,
                        userId: authority.id
                    });
                    emailSent = true;
                } catch (emailError) {
                    console.error("Rejection email failed:", emailError);
                }
            }
            
            // Show success message based on email status
            setErr(emailSent ? t.success.rejected : t.success.rejectedNoEmail);
            setTimeout(() => setErr(""), 3000);
            
            // Remove from list and close modal
            setRows((prev) => prev.filter((x) => x.id !== id));
            setShowRejectModal(false);
            setRejectReason("");
            setSelectedAuthority(null);
        } catch (e: any) {
            setErr(e?.message || "Rejection failed.");
        } finally {
            setBusyId(null);
        }
    };

    const openRejectModal = (authority: Authority) => {
        setSelectedAuthority(authority);
        setRejectReason("");
        setShowRejectModal(true);
    };

    const handleRejectConfirm = () => {
        if (!rejectReason.trim()) {
            setErr(t.rejectModal.required);
            return;
        }
        if (selectedAuthority) {
            rejectAuthority(selectedAuthority.id, rejectReason.trim());
        }
    };

    return (
        <Screen padded>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-green-900">
                        {t.titles[routeTitleKey]}
                    </h1>
                    <p className="text-sm text-green-800/80 mt-1">{t.subtitle}</p>
                </div>

                <button
                    onClick={() => router.back()}
                    className="shrink-0 px-4 py-2 rounded-xl bg-white border border-green-200 text-green-900 font-extrabold hover:bg-green-50"
                >
                    {t.back}
                </button>
            </div>

            {loading && (
                <div className="mt-10 text-center text-green-700 font-semibold">Loading…</div>
            )}

            {!loading && err && (
                <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                    err.includes("successfully") || err.includes("approved") || err.includes("rejected")
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                }`}>
                    {err}
                </div>
            )}

            {!loading && !err && rows.length === 0 && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-white px-4 py-4 text-sm font-semibold text-green-800">
                    {t.empty}
                </div>
            )}

            {!loading && !err && rows.length > 0 && (
                <div className="mt-6 space-y-3">
                    {rows.map((a) => (
                        <div key={a.id} className="rounded-2xl bg-white border border-green-200 p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-lg font-extrabold text-green-900 truncate">{a.name || "—"}</div>
                                    <div className="text-sm text-green-900/80 mt-1">
                                        {a.email || "-"} • {a.mobile || "-"} • Aadhaar ****{a.aadhaarLast4 || "----"}
                                    </div>
                                    <div className="text-xs text-green-900/60 mt-2">
                                        {a.village || "-"}, {a.gramPanchayat || "-"}, {a.taluk || "-"}, {a.district || "-"}
                                        {a.panchayatId ? ` • ${a.panchayatId}` : ""}
                                    </div>

                                    <div className="mt-2 inline-flex px-3 py-1 rounded-full text-xs font-extrabold border border-yellow-200 bg-yellow-50 text-yellow-800">
                                        {t.status}: {a?.verification?.status || "pending"}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:w-[260px]">
                                    <button
                                        disabled={busyId === a.id}
                                        onClick={() => approveAuthority(a.id)}
                                        className="rounded-xl bg-green-700 text-white font-extrabold py-3 disabled:opacity-60 hover:bg-green-800 transition"
                                    >
                                        {busyId === a.id ? "..." : t.approve}
                                    </button>
                                    <button
                                        disabled={busyId === a.id}
                                        onClick={() => openRejectModal(a)}
                                        className="rounded-xl bg-red-600 text-white font-extrabold py-3 disabled:opacity-60 hover:bg-red-700 transition"
                                    >
                                        {busyId === a.id ? "..." : t.reject}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-red-800 mb-4">
                            {t.rejectModal.title}
                        </h3>
                        
                        {selectedAuthority && (
                            <div className="mb-4 p-3 bg-red-50 rounded-xl">
                                <p className="text-sm font-semibold text-red-900">
                                    {selectedAuthority.name} • {selectedAuthority.role?.toUpperCase()}
                                </p>
                                <p className="text-xs text-red-700 mt-1">
                                    {selectedAuthority.email}
                                </p>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                {t.rejectModal.reason} *
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm min-h-[100px]"
                                placeholder={t.rejectModal.reasonPlaceholder}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                This reason will be included in the email sent to the authority.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason("");
                                    setSelectedAuthority(null);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50"
                            >
                                {t.rejectModal.cancel}
                            </button>
                            <button
                                onClick={handleRejectConfirm}
                                disabled={busyId === selectedAuthority?.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60"
                            >
                                {busyId === selectedAuthority?.id ? "..." : t.rejectModal.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Screen>
    );
}
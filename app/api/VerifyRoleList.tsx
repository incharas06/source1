// VerifyRoleList.tsx (EmailJS version - works on Firebase Hosting / no Blaze)
// 1) npm i emailjs-com
// 2) Put your real TEMPLATE_ID and PUBLIC_KEY below

"use client";

import emailjs from "emailjs-com";

// ✅ fill these
const SERVICE_ID = "service_0auv7m2";
const TEMPLATE_ID = "template_rimkr3i"; // <-- from EmailJS Email Templates
const PUBLIC_KEY = "qFpPSihDvutRym16a";   // <-- from EmailJS Account -> API Keys (Public Key)

/** Send approval email using EmailJS (client-side) */
export async function sendApprovalEmail(params: {
    to_email: string;
    name: string;
    role: string;
}) {
    // Basic guard
    if (!params.to_email) throw new Error("Missing recipient email");
    if (!params.name) params.name = "User";

    // EmailJS template variables must match:
    // To Email in template: {{to_email}}
    // Body uses: {{name}}, {{role}}
    return emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
            to_email: params.to_email,
            name: params.name,
            role: params.role,
        },
        PUBLIC_KEY
    );
}

/* =========================
   Example usage inside approveAuthority()
   ========================= */
// somewhere in your component file
async function approveAuthority(authority: {
    email: string;
    name: string;
    role: string;
}) {
    try {
        // ... your Firestore approve/update code here (set verified/status etc.)

        // ✅ Send approval email (NO nodemailer, NO functions)
        await sendApprovalEmail({
            to_email: authority.email,
            name: authority.name,
            role: authority.role,
        });

        console.log("Approval email sent ✅");
    } catch (err: any) {
        console.error("Approval email failed:", err?.message || err);
        throw err;
    }
}

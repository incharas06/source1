// functions/src/emailTemplates.ts
export type EmailLocale = "en" | "kn" | "hi";

type BaseArgs = {
    locale: EmailLocale;
    issueId: string;
    title: string;
    category?: string;
    panchayatId?: string;
    createdAtText?: string;
    status?: string;
    actionUrl?: string; // link to authority issue page
};

function dict(locale: EmailLocale) {
    const L = {
        en: {
            app: "VITAL",
            footer: "This is an automated email from VITAL.",
            view: "View Issue",
            issue: "Issue",
            category: "Category",
            panchayat: "Panchayat",
            created: "Created",
            status: "Status",
        },
        kn: {
            app: "VITAL",
            footer: "ಇದು VITAL ಇಂದ ಸ್ವಯಂಚಾಲಿತ ಇಮೇಲ್.",
            view: "ಸಮಸ್ಯೆ ನೋಡಿ",
            issue: "ಸಮಸ್ಯೆ",
            category: "ವರ್ಗ",
            panchayat: "ಪಂಚಾಯತ್",
            created: "ದಿನಾಂಕ",
            status: "ಸ್ಥಿತಿ",
        },
        hi: {
            app: "VITAL",
            footer: "यह VITAL से ऑटोमेटेड ईमेल है।",
            view: "मुद्दा देखें",
            issue: "मुद्दा",
            category: "कैटेगरी",
            panchayat: "पंचायत",
            created: "दिनांक",
            status: "स्टेटस",
        },
    } as const;
    return L[locale] || L.en;
}

function wrap(title: string, body: string, locale: EmailLocale) {
    const d = dict(locale);
    return `
  <div style="font-family:Arial,sans-serif;background:#f6fff8;padding:18px">
    <div style="max-width:640px;margin:0 auto;background:white;border:1px solid #d6f3df;border-radius:16px;overflow:hidden">
      <div style="padding:16px 18px;background:#0f7a3a;color:white">
        <div style="font-weight:800;font-size:16px">${d.app}</div>
        <div style="opacity:.9;margin-top:4px">${title}</div>
      </div>
      <div style="padding:18px">
        ${body}
        <div style="margin-top:18px;color:#2f6b45;font-size:12px;opacity:.8">${d.footer}</div>
      </div>
    </div>
  </div>`;
}

function kv(locale: EmailLocale, a: BaseArgs) {
    const d = dict(locale);
    const row = (k: string, v?: string) =>
        v
            ? `<div style="margin:6px 0"><span style="color:#245a3a;font-weight:700">${k}:</span> <span style="color:#163a26">${v}</span></div>`
            : "";

    return `
    ${row(d.issue, `${a.issueId} — ${a.title}`)}
    ${row(d.category, a.category)}
    ${row(d.panchayat, a.panchayatId)}
    ${row(d.created, a.createdAtText)}
    ${row(d.status, a.status)}
  `;
}

function cta(locale: EmailLocale, url?: string) {
    const d = dict(locale);
    if (!url) return "";
    return `
    <div style="margin-top:16px">
      <a href="${url}" style="display:inline-block;background:#0f7a3a;color:white;text-decoration:none;font-weight:800;padding:10px 14px;border-radius:12px">
        ${d.view}
      </a>
    </div>
  `;
}

/** Email to Villager (status update or escalation notice) */
export function villagerStatusEmail(args: BaseArgs & { message: string }) {
    const body = `
    <div style="color:#163a26;font-size:14px;line-height:1.5">
      <div style="font-weight:800;margin-bottom:8px">${args.message}</div>
      ${kv(args.locale, args)}
      ${cta(args.locale, args.actionUrl)}
    </div>
  `;
    const subject =
        args.locale === "kn"
            ? `VITAL: ನಿಮ್ಮ ಸಮಸ್ಯೆಯ ಅಪ್ಡೇಟ್ (${args.issueId})`
            : args.locale === "hi"
                ? `VITAL: आपके मुद्दे का अपडेट (${args.issueId})`
                : `VITAL: Issue update (${args.issueId})`;

    return { subject, html: wrap(subject, body, args.locale) };
}

/** Escalation email to PDO/TDO/DDO */
export function escalationEmail(
    args: BaseArgs & {
        toRole: "pdo" | "tdo" | "ddo";
        reason: string; // "SLA breached", "Manual escalation", etc.
    }
) {
    const roleLabel =
        args.toRole === "pdo" ? "PDO" : args.toRole === "tdo" ? "TDO" : "DDO";

    const reasonText =
        args.locale === "kn"
            ? `ಕಾರಣ: ${args.reason}`
            : args.locale === "hi"
                ? `कारण: ${args.reason}`
                : `Reason: ${args.reason}`;

    const body = `
    <div style="color:#163a26;font-size:14px;line-height:1.5">
      <div style="font-weight:900;margin-bottom:8px">Escalation → ${roleLabel}</div>
      <div style="margin-bottom:10px">${reasonText}</div>
      ${kv(args.locale, args)}
      ${cta(args.locale, args.actionUrl)}
    </div>
  `;

    const subject =
        args.locale === "kn"
            ? `VITAL: Escalation (${roleLabel}) — ${args.issueId}`
            : args.locale === "hi"
                ? `VITAL: Escalation (${roleLabel}) — ${args.issueId}`
                : `VITAL: Escalation (${roleLabel}) — ${args.issueId}`;

    return { subject, html: wrap(subject, body, args.locale) };
}

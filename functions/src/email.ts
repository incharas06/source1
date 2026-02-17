import * as nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,   // example: vital.notify@gmail.com
        pass: process.env.MAIL_PASS,   // app password
    },
});

export async function sendMail(
    to: string,
    subject: string,
    html: string
) {
    await mailer.sendMail({
        from: `"VITAL Alerts" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
    });
}

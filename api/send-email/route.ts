import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, subject, template, data } = body;

        // Validate required fields
        if (!to || !subject) {
            return NextResponse.json({ 
                success: false, 
                error: 'Missing required fields: to, subject' 
            }, { status: 400 });
        }

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'uba@vvce.ac.in',
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        let htmlContent = '';

        if (template === 'registration') {
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #15803d;">📋 Registration Received Successfully!</h2>
                    <p>Dear <strong>${data.name}</strong>,</p>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #15803d; margin-top: 0;">Application Summary:</h3>
                        <p><strong>Application ID:</strong> ${data.userId}</p>
                        <p><strong>Role Applied:</strong> ${data.role.toUpperCase()}</p>
                        <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">PENDING VERIFICATION</span></p>
                        <p><strong>Submitted On:</strong> ${data.date}</p>
                    </div>

                    <p>You will receive another email once your account is verified by the admin.</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated email from Village Upliftment System.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            `;
        } else if (template === 'approval') {
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #15803d;">🎉 Account Successfully Verified!</h2>
                    <p>Dear <strong>${data.name}</strong>,</p>
                    <p>We are pleased to inform you that your ${data.role.toUpperCase()} account has been verified and activated.</p>
                    
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #15803d; margin-top: 0;">Account Details:</h3>
                        <p><strong>Role:</strong> ${data.role.toUpperCase()}</p>
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Status:</strong> <span style="color: #15803d; font-weight: bold;">ACTIVE</span></p>
                        <p><strong>Verified On:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                    </div>

                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>You can now login to your account</li>
                        <li>Access your dashboard to manage villager registrations</li>
                        <li>Review and respond to issues in your jurisdiction</li>
                        <li>Submit fund requests if applicable</li>
                    </ol>

                    <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>📱 Login Instructions:</strong></p>
                        <p>1. Visit: [Your Application URL]</p>
                        <p>2. Click "Authority Login"</p>
                        <p>3. Use your registered email and password</p>
                    </div>

                    <p>If you have any questions, please contact our support team.</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated message from the Village Upliftment System.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            `;
        } else if (template === 'rejection') {
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc2626;">❌ Registration Request Rejected</h2>
                    <p>Dear <strong>${data.name}</strong>,</p>
                    <p>We regret to inform you that your ${data.role.toUpperCase()} registration request has been rejected.</p>
                    
                    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #dc2626; margin-top: 0;">Application Details:</h3>
                        <p><strong>Role:</strong> ${data.role.toUpperCase()}</p>
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Reason for Rejection:</strong> ${data.reason || 'Document verification failed'}</p>
                    </div>

                    <p>If you believe this is a mistake, you may re-apply after addressing the issues mentioned above.</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated message from the Village Upliftment System.<br>
                        Please do not reply to this email.
                    </p>
                </div>
            `;
        } else {
            // Default template
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #15803d;">${subject}</h2>
                    <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px;">
                        ${data.message || 'No message content provided.'}
                    </div>
                </div>
            `;
        }

        const mailOptions = {
            from: `"Village Upliftment System" <${process.env.EMAIL_USER || 'uba@vvce.ac.in'}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ 
            success: true, 
            message: 'Email sent successfully' 
        });
    } catch (error: any) {
        console.error('Email sending error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
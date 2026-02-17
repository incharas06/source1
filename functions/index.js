const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'uba@vvce.ac.in',
    pass: process.env.EMAIL_PASSWORD, // Store password in Firebase environment
  },
});

// Cloud Function to send verification email
exports.sendVerificationEmail = functions.firestore
  .document('authorities/{authorityId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const authorityId = context.params.authorityId;

    // Check if verification status changed
    const beforeStatus = beforeData.verification?.status || 'pending';
    const afterStatus = afterData.verification?.status || 'pending';

    // If status didn't change, do nothing
    if (beforeStatus === afterStatus) {
      return null;
    }

    const authorityEmail = afterData.email;
    const authorityName = afterData.name || 'Authority User';
    const authorityRole = afterData.role;

    // Prepare email based on status
    let subject = '';
    let htmlContent = '';

    if (afterStatus === 'verified') {
      subject = `Account Verified - ${authorityRole.toUpperCase()} Registration`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #15803d;">🎉 Account Successfully Verified!</h2>
          <p>Dear <strong>${authorityName}</strong>,</p>
          <p>We are pleased to inform you that your ${authorityRole.toUpperCase()} account has been verified and activated.</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #15803d; margin-top: 0;">Account Details:</h3>
            <p><strong>Role:</strong> ${authorityRole.toUpperCase()}</p>
            <p><strong>Name:</strong> ${authorityName}</p>
            <p><strong>Email:</strong> ${authorityEmail}</p>
            <p><strong>District:</strong> ${afterData.district || 'Not specified'}</p>
            <p><strong>Status:</strong> <span style="color: #15803d; font-weight: bold;">ACTIVE</span></p>
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
    } else if (afterStatus === 'rejected') {
      subject = `Registration Rejected - ${authorityRole.toUpperCase()} Application`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">❌ Registration Request Rejected</h2>
          <p>Dear <strong>${authorityName}</strong>,</p>
          <p>We regret to inform you that your ${authorityRole.toUpperCase()} registration request has been rejected.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Application Details:</h3>
            <p><strong>Role:</strong> ${authorityRole.toUpperCase()}</p>
            <p><strong>Name:</strong> ${authorityName}</p>
            <p><strong>Email:</strong> ${authorityEmail}</p>
            <p><strong>Reason for Rejection:</strong> ${afterData.rejectedReason || 'Document verification failed'}</p>
          </div>

          <p><strong>Possible Reasons:</strong></p>
          <ul>
            <li>Incomplete or incorrect information provided</li>
            <li>Document verification issues</li>
            <li>Jurisdiction conflicts</li>
            <li>Duplicate registration attempt</li>
          </ul>

          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📞 Contact Support:</strong></p>
            <p>If you believe this is a mistake or need clarification, please contact:</p>
            <p>Email: uba@vvce.ac.in</p>
            <p>Phone: [Support Phone Number]</p>
          </div>

          <p>You may re-apply after addressing the issues mentioned above.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated message from the Village Upliftment System.<br>
            Please do not reply to this email.
          </p>
        </div>
      `;
    } else if (afterStatus === 'pending' && beforeStatus !== 'pending') {
      // If status changed to pending (e.g., from rejected to pending for re-review)
      subject = `Application Status Updated - ${authorityRole.toUpperCase()}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">🔄 Application Status Updated</h2>
          <p>Dear <strong>${authorityName}</strong>,</p>
          <p>Your ${authorityRole.toUpperCase()} application status has been updated to <strong>PENDING REVIEW</strong>.</p>
          
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Current Status:</strong> Under Review</p>
            <p><strong>Application ID:</strong> ${authorityId}</p>
            <p><strong>Review Timeline:</strong> 2-3 business days</p>
          </div>

          <p>You will receive another email once the review is complete.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated message from the Village Upliftment System.<br>
            Please do not reply to this email.
          </p>
        </div>
      `;
    } else {
      // No email needed for other status changes
      return null;
    }

    // Email configuration
    const mailOptions = {
      from: '"Village Upliftment System" <uba@vvce.ac.in>',
      to: authorityEmail,
      subject: subject,
      html: htmlContent,
    };

    try {
      // Send email
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${authorityEmail} for status: ${afterStatus}`);
      
      // Update email sent timestamp in Firestore
      await change.after.ref.update({
        'verification.emailSentAt': admin.firestore.FieldValue.serverTimestamp(),
        'verification.lastEmailStatus': 'sent',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return null;
    } catch (error) {
      console.error('Error sending verification email:', error);
      
      // Update email sent status as failed
      await change.after.ref.update({
        'verification.lastEmailStatus': 'failed',
        'verification.emailError': error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return null;
    }
  });

// HTTP endpoint for manual email sending (if needed)
exports.sendEmailManual = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const { authorityId, type, customMessage } = req.body;
      
      // Get authority data
      const authorityDoc = await admin.firestore()
        .collection('authorities')
        .doc(authorityId)
        .get();
      
      if (!authorityDoc.exists) {
        return res.status(404).json({ error: 'Authority not found' });
      }
      
      const authorityData = authorityDoc.data();
      const email = authorityData.email;
      const name = authorityData.name || 'Authority User';
      const role = authorityData.role;

      let subject = '';
      let htmlContent = '';

      if (type === 'welcome') {
        subject = `Welcome - ${role.toUpperCase()} Account Created`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #15803d;">Welcome to Village Upliftment System!</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <p>Your ${role.toUpperCase()} account has been successfully created.</p>
            <p>Status: <strong>PENDING VERIFICATION</strong></p>
            <p>You will receive another email once your account is verified by the admin.</p>
          </div>
        `;
      } else if (type === 'custom') {
        subject = `Message from Village Upliftment System`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #15803d;">Message from Administration</h2>
            <p>Dear <strong>${name}</strong>,</p>
            <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px;">
              ${customMessage || 'No message provided.'}
            </div>
          </div>
        `;
      }

      const mailOptions = {
        from: '"Village Upliftment System" <uba@vvce.ac.in>',
        to: email,
        subject: subject,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      
      // Log the email send
      await admin.firestore().collection('email_logs').add({
        authorityId: authorityId,
        email: email,
        type: type,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      });

      res.status(200).json({ 
        success: true, 
        message: 'Email sent successfully' 
      });
    } catch (error) {
      console.error('Error in manual email sending:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
});

// Function to send registration confirmation email
exports.sendRegistrationEmail = functions.firestore
  .document('authorities/{authorityId}')
  .onCreate(async (snap, context) => {
    const authorityData = snap.data();
    const authorityId = context.params.authorityId;
    const email = authorityData.email;
    const name = authorityData.name || 'Authority User';
    const role = authorityData.role;

    const mailOptions = {
      from: '"Village Upliftment System" <uba@vvce.ac.in>',
      to: email,
      subject: `Registration Received - ${role.toUpperCase()} Application`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #15803d;">📋 Registration Received Successfully!</h2>
          <p>Dear <strong>${name}</strong>,</p>
          
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #15803d; margin-top: 0;">Application Summary:</h3>
            <p><strong>Application ID:</strong> ${authorityId}</p>
            <p><strong>Role Applied:</strong> ${role.toUpperCase()}</p>
            <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">PENDING VERIFICATION</span></p>
            <p><strong>Submitted On:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <p><strong>What happens next?</strong></p>
          <ol>
            <li>Your application will be reviewed by our admin team</li>
            <li>This process usually takes <strong>1-3 business days</strong></li>
            <li>You'll receive an email once your account is verified</li>
            <li>You can check your application status anytime</li>
          </ol>

          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>💡 Important Information:</strong></p>
            <p>• Keep your login credentials safe</p>
            <p>• Ensure your contact information is correct</p>
            <p>• You'll need to login once verification is complete</p>
          </div>

          <p>If you have any questions, please contact:</p>
          <p>📧 uba@vvce.ac.in</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated confirmation email.<br>
            Please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Registration email sent to ${email}`);
      
      // Update email sent status
      await snap.ref.update({
        'verification.registrationEmailSent': true,
        'verification.registrationEmailSentAt': admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return null;
    } catch (error) {
      console.error('Error sending registration email:', error);
      
      await snap.ref.update({
        'verification.registrationEmailSent': false,
        'verification.registrationEmailError': error.message,
      });
      
      return null;
    }
  });
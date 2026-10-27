const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // If user provided custom SMTP in .env
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // Otherwise, fallback to Ethereal / simulated development transporter
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log(' Using Ethereal test mailer account for simulated email delivery');
    return transporter;
  } catch (err) {
    console.warn('⚠️ Could not create Ethereal account, using console logger mailer fallback:', err.message);
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n--- [SIMULATED EMAIL SENT] ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Text / Body Summary:`);
        console.log(mailOptions.text || mailOptions.html.substring(0, 300) + '...');
        console.log('------------------------------\n');
        return { messageId: 'simulated-' + Date.now() };
      }
    };
    return transporter;
  }
};

/**
 * Send Zoom Interview Meeting Email to Tutor
 */
const sendZoomInterviewEmail = async ({ to, tutorName, zoomLink, meetingId, passcode, scheduledAt, notes }) => {
  try {
    const mail = await getTransporter();

    const formattedDate = scheduledAt
      ? new Date(scheduledAt).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'To be mutually confirmed via phone';

    const fromAddress = process.env.SMTP_FROM || '"TutorConnect Verification Team" <admin@tutorconnect.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px 25px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0; opacity: 0.9; font-size: 15px; }
          .content { padding: 30px 25px; line-height: 1.6; }
          .highlight-card { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .detail-row { margin-bottom: 10px; font-size: 15px; }
          .detail-label { font-weight: 600; color: #1e3a8a; display: inline-block; width: 140px; }
          .btn-container { text-align: center; margin: 30px 0; }
          .btn-zoom { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37,99,235,0.25); }
          .checklist { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px 22px; margin-top: 25px; }
          .checklist h4 { margin-top: 0; color: #0f172a; }
          .checklist ul { margin: 0; padding-left: 20px; }
          .checklist li { margin-bottom: 6px; font-size: 14px; color: #475569; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TutorConnect</h1>
            <p>Verification & Home Tuition Quality Screening</p>
          </div>
          <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Hello ${tutorName},</h2>
            <p>Thank you for submitting your tutor profile on <strong>TutorConnect</strong>! We are excited about the prospect of having you join our community of elite, verified home tutors.</p>
            
            <p>To ensure student safety, teaching quality, and high trust for parents, our academic admin team conducts a mandatory 15-minute video interview via Zoom before activating tutor profiles on our front page.</p>

            <div class="highlight-card">
              <h3 style="margin-top:0; color:#1e3a8a;">📅 Interview Schedule & Zoom Details</h3>
              <div class="detail-row"><span class="detail-label">Date & Time:</span> <strong>${formattedDate}</strong></div>
              <div class="detail-row"><span class="detail-label">Zoom Link:</span> <a href="${zoomLink}" target="_blank" style="color:#2563eb; word-break:break-all;">${zoomLink}</a></div>
              ${meetingId ? `<div class="detail-row"><span class="detail-label">Meeting ID:</span> <code>${meetingId}</code></div>` : ''}
              ${passcode ? `<div class="detail-row"><span class="detail-label">Passcode:</span> <code>${passcode}</code></div>` : ''}
              ${notes ? `<div class="detail-row" style="margin-top:12px; font-style:italic;"><span class="detail-label">Admin Note:</span> ${notes}</div>` : ''}
            </div>

            <div class="btn-container">
              <a href="${zoomLink}" class="btn-zoom" target="_blank">Join Zoom Interview</a>
            </div>

            <div class="checklist">
              <h4>Preparation Checklist:</h4>
              <ul>
                <li>Please join 5 minutes before the scheduled time.</li>
                <li>Keep a soft or hard copy of your academic qualification certificates / ID proof ready for quick verification.</li>
                <li>Ensure a quiet environment with a working webcam and microphone.</li>
                <li>Be ready to explain your preferred tuition areas, teaching experience, and methodology.</li>
              </ul>
            </div>

            <p style="margin-top: 25px;">Once your interview is complete, the admin will approve your profile as <strong>"Verified"</strong>, and you will begin receiving direct home tuition requests from parents in your preferred locality!</p>

            <p>Best regards,<br><strong>TutorConnect Verification Team</strong><br>Email: support@tutorconnect.com</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} TutorConnect. All rights reserved. Connecting verified home tutors with parents.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mail.sendMail({
      from: fromAddress,
      to,
      subject: `🎯 TutorConnect Verification Interview: Zoom Meeting Scheduled (${tutorName})`,
      text: `Hello ${tutorName},\n\nYour TutorConnect verification interview has been scheduled.\n\nDate & Time: ${formattedDate}\nZoom Link: ${zoomLink}\nMeeting ID: ${meetingId || 'N/A'}\nPasscode: ${passcode || 'N/A'}\n\nPlease join on time with your certificates ready.\n\nBest regards,\nTutorConnect Team`,
      html: htmlContent
    });

    let previewUrl = null;
    if (nodemailer.getTestMessageUrl && info) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`✉️ Email sent to ${to}. Ethereal Preview URL: ${previewUrl}`);
      }
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('Error sending zoom interview email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Status Update Email (e.g., Profile Approved / Verified)
 */
const sendProfileVerifiedEmail = async ({ to, tutorName }) => {
  try {
    const mail = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"TutorConnect Team" <admin@tutorconnect.com>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #16a34a;"> Congratulations, ${tutorName}!</h2>
        <p>We are delighted to inform you that your interview and credentials have been verified by our academic admin team.</p>
        <p><strong>Your profile is now VERIFIED and LIVE on the TutorConnect homepage!</strong></p>
        <p>Parents searching for home tutors in your preferred locations and subjects can now view your verified badge, profile details, and request tuition / demo sessions with you directly.</p>
        <p><a href="http://localhost:${process.env.PORT || 3000}/tutors" style="display:inline-block; background-color:#16a34a; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold;">View Live Directory</a></p>
        <p>Best regards,<br>The TutorConnect Team</p>
      </div>
    `;

    await mail.sendMail({
      from: fromAddress,
      to,
      subject: '🎉 Congratulations! Your TutorConnect Profile is now VERIFIED & LIVE',
      html: htmlContent
    });
    return { success: true };
  } catch (err) {
    console.error('Error sending verified email:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  sendZoomInterviewEmail,
  sendProfileVerifiedEmail
};

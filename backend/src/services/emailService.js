const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",

  family: 4, // ⭐ FORCE IPv4

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(toEmail, toName, otp) {
  const appName = process.env.APP_NAME || 'HealthCare';
  await transporter.sendMail({
    from:    `"${appName}" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: `${otp} is your ${appName} verification code`,
    text: `Hi ${toName},\n\nYour verification code is: ${otp}\n\nExpires in 10 minutes.\n\n— ${appName} Team`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#16a34a;margin-bottom:4px">${appName}</h2>
        <p style="color:#64748b;margin-top:0">Email Verification</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
        <p>Hi <strong>${toName}</strong>,</p>
        <p style="color:#475569">Use the code below to verify your email. Expires in <strong>10 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f172a">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px">If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { generateOtp, sendOtpEmail };
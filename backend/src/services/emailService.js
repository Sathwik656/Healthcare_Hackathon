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
  const appName = process.env.APP_NAME || "HealthCare";

  try {
    await transporter.sendMail({
      from: `"${appName}" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `${otp} is your ${appName} verification code`,
      text: `Hi ${toName},\n\nYour verification code is: ${otp}\n\nExpires in 10 minutes.\n\n— ${appName} Team`,
      html: `...`,
    });

    console.log("✅ OTP email sent to:", toEmail);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
}

module.exports = { generateOtp, sendOtpEmail };
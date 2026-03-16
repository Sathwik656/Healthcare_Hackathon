const FormData = require("form-data");
const Mailgun = require("mailgun.js");

const mailgun = new Mailgun(FormData);

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY,
  url: "https://api.mailgun.net",
});

/* ───────── OTP Generator ───────── */

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* ───────── Email Template ───────── */

function buildOtpHtml({ toName, otp, appName, expiryMinutes }) {
  const firstName = toName?.split(" ")[0] || "there";

  return `
  <div style="font-family:Arial;background:#f0fdf4;padding:40px 0;">
    <div style="max-width:520px;margin:auto;background:white;border-radius:16px;border:1px solid #e2e8f0;padding:32px">
      
      <div style="text-align:center;margin-bottom:20px">
        <h2 style="color:#16a34a;margin:0">${appName}</h2>
        <p style="color:#64748b">Secure Email Verification</p>
      </div>

      <p style="font-size:16px;color:#334155">
        Hi <strong>${firstName}</strong>,
      </p>

      <p style="color:#475569">
        Use the verification code below to complete your sign-in.
      </p>

      <div style="text-align:center;margin:32px 0">
        <div style="
          display:inline-block;
          background:#ecfdf5;
          border:2px dashed #16a34a;
          padding:18px 28px;
          border-radius:10px;
          font-size:34px;
          font-weight:700;
          letter-spacing:8px;
          color:#15803d;
        ">
          ${otp}
        </div>
      </div>

      <p style="color:#64748b;font-size:14px;text-align:center">
        This code expires in <strong>${expiryMinutes} minutes</strong>
      </p>

      <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>

      <p style="font-size:13px;color:#94a3b8;text-align:center">
        If you didn't request this code, you can safely ignore this email.
      </p>

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:20px">
        © ${new Date().getFullYear()} ${appName}
      </p>

    </div>
  </div>
  `;
}

/* ───────── Send OTP Email ───────── */

async function sendOtpEmail(toEmail, toName, otp, expiryMinutes = 10) {

  const appName = process.env.APP_NAME || "HealthCare";
  const domain = process.env.MAILGUN_DOMAIN;

  if (!domain) {
    throw new Error("MAILGUN_DOMAIN is missing from environment variables");
  }

  console.log("[MAILGUN] Sending to:", toEmail);
  console.log("[MAILGUN] Domain:", domain);

  const response = await mg.messages.create(domain, {
    from: `${appName} <postmaster@${domain}>`, // required for sandbox
    to: [toEmail],
    subject: `${otp} is your ${appName} verification code`,
    text: `Your ${appName} verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,
    html: buildOtpHtml({ toName, otp, appName, expiryMinutes }),
  });

  console.log("[MAILGUN] Response:", response);

  return response;
}

module.exports = { generateOtp, sendOtpEmail };
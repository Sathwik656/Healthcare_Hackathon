const axios = require('axios');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(toEmail, toName, otp) {
  const appName = process.env.APP_NAME || 'HealthCare';

  const response = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender:      { name: process.env.BREVO_SENDER_NAME || appName, email: process.env.BREVO_SENDER_EMAIL },
      to:          [{ email: toEmail, name: toName }],
      subject:     `${otp} is your ${appName} verification code`,
      textContent: `Hi ${toName},\n\nYour code is: ${otp}\n\nExpires in 10 minutes.\n\n— ${appName} Team`,
      htmlContent: `
        <div style="font-family:Arial;background:#f8fafc;padding:40px">
          <div style="max-width:520px;margin:auto;background:white;border-radius:16px;border:1px solid #e2e8f0;padding:32px">
            <h2 style="color:#16a34a;margin-top:0">${appName}</h2>
            <p>Hi <strong>${toName}</strong>,</p>
            <p>Use the verification code below to confirm your email.</p>
            <div style="text-align:center;margin:30px 0">
              <span style="font-size:42px;font-weight:800;letter-spacing:10px;
                           color:#0f172a;background:#f0fdf4;border:2px dashed #16a34a;
                           padding:18px 26px;border-radius:12px;display:inline-block">
                ${otp}
              </span>
            </div>
            <p style="color:#64748b;font-size:14px">Expires in <strong>10 minutes</strong>.</p>
            <p style="font-size:13px;color:#94a3b8">If you didn't request this, ignore it.</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
            <p style="font-size:12px;color:#94a3b8;text-align:center">© ${new Date().getFullYear()} ${appName}</p>
          </div>
        </div>
      `,
    },
    {
      headers: {
        'api-key':      process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('[BREVO] Sent:', response.data.messageId);
  return response.data;
}

module.exports = { generateOtp, sendOtpEmail };
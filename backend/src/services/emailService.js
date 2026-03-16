const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(toEmail, toName, otp) {
  const appName = process.env.APP_NAME || 'HealthCare';

  console.log('[RESEND] Attempting to send to:', toEmail);
  console.log('[RESEND] API Key exists:', !!process.env.RESEND_API_KEY);
  console.log('[RESEND] API Key prefix:', process.env.RESEND_API_KEY?.slice(0, 8));

  const response = await resend.emails.send({
    from:    `${appName} <onboarding@resend.dev>`,
    to:      toEmail,
    subject: `${otp} is your ${appName} verification code`,
    html:    `<p>Your code is <strong>${otp}</strong></p>`,
  });

  console.log('[RESEND] Full response:', JSON.stringify(response));

  if (response.error) throw new Error(response.error.message);
  return response;
}

module.exports = { generateOtp, sendOtpEmail };

import nodemailer from "nodemailer";
import axios from "axios";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465,
    auth: { user, pass },
  });
};

/**
 * Universal email dispatcher helper.
 * Automatically selects the best available service:
 * 1. Resend HTTP API (via REST, extremely robust on PaaS like Render, port-blocking proof)
 * 2. Nodemailer SMTP (fallback if credentials exist and API is absent)
 * 3. Log Simulation (development offline fallback)
 */
const sendMailHelper = async ({ to, subject, text, html }) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.SMTP_FROM || "onboarding@resend.dev";

  // Case 1: Resend HTTP API (Port-blocking proof REST API)
  if (resendApiKey) {
    try {
      console.log(`✉️ Sending mail to ${to} via Resend HTTP API...`);
      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from,
          to,
          subject,
          text,
          html,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
        }
      );

      const data = response.data;
      console.log(`📬 Mail dispatched to ${to} successfully via Resend API (ID: ${data.id})`);
      return { success: true, simulated: false };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || error.message;
      console.error(`❌ Resend API Transmit Error: ${errorMsg}`);
      console.log("🔄 Attempting SMTP fallback dynamic switch...");
    }
  }

  // Case 2: SMTP server
  const transporter = getTransporter();
  if (transporter) {
    try {
      console.log(`✉️ Sending mail to ${to} via Nodemailer SMTP...`);
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`📬 Mail dispatched to ${to} successfully via SMTP`);
      return { success: true, simulated: false };
    } catch (error) {
      console.error(`❌ SMTP Transmit Error: ${error.message}`);
      return { success: false, simulated: false, error: error.message };
    }
  }

  // Case 3: Offline Simulation
  const warningMsg = !resendApiKey && !process.env.SMTP_HOST;
  if (warningMsg) {
    console.warn("\n========================================================");
    console.warn("⚠️ WARNING: Mail dispatcher settings are missing! (.env)");
    console.warn("Outbound email fell back to local terminal console simulator.");
    console.warn("Provide RESEND_API_KEY or SMTP parameters to enable true delivery.");
    console.warn("========================================================\n");
  }

  console.log(`\n📬 [EMAIL SIMULATION] Outbound Dispatch To: ${to}\nSubject: ${subject}\nPlain Body:\n${text}\n`);
  return { success: true, simulated: true };
};

export const sendWelcomeEmail = async (email, name) => {
  const title = "Welcome to SCAS Ledger!";
  const body = `Hello ${name},\n\nWelcome to the Smart Classroom Analytics System! Your institutional account is register-coded successfully under the email address: ${email}.\n\nExplore courses and audit modern attendance analytics securely.\n\nWarm regards,\nSCAS Ledger Administration`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #2563eb;">SCAS Ledger</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Welcome to the Smart Classroom Analytics System (SCAS)! Your account stands registered successfully.</p>
      <p>Registered Email: <code>${email}</code></p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">This email was sent from an automated administrative script.</p>
    </div>
  `;

  const result = await sendMailHelper({ to: email, subject: title, text: body, html });
  return result.success;
};

export const sendPasswordResetEmail = async (email, resetUrl, resetToken) => {
  const title = "SCAS Identity Key Ledger Recovery Verification";
  const body = `Hello,\n\nWe received a command request to reset your SCAS account password.\nUse the following link to assign new access credentials:\n${resetUrl}\n\nSecurity token: ${resetToken}\n\nIf you did not issue this security reset ticket, ignore this message safely.\n\nSCAS Security Desk`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #2563eb;">SCAS Security Desk</h2>
      <p>Hello,</p>
      <p>We received an authorization ticket to update your password.</p>
      <p>Please click the button below to re-establish your login access credentials:</p>
      <div style="margin: 20px 0;">
        <a href="${resetUrl}" style="background-color: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>Or use the security key: <code>${resetToken}</code></p>
      <p>Alternatively, paste this URL in your web explorer tab:</p>
      <p style="font-size: 13px; color: #2563eb; font-family: monospace;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b;">If you did not request this, please disregard this email safely.</p>
    </div>
  `;

  return await sendMailHelper({ to: email, subject: title, text: body, html });
};

export const sendOTPEmail = async (email, otp) => {
  const title = "SCAS Account Registration Verification Code";
  const body = `Hello,\n\nYour Smart Classroom Analytics System (SCAS) account registration verification code is: ${otp}.\n\nThis verification code is valid for 10 minutes.\n\nWarm regards,\nSCAS Ledger Administration`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #2563eb;">SCAS Security Gate</h2>
      <p>Hello,</p>
      <p>We received a request to register a new account on the Smart Classroom Analytics System (SCAS) under this email address.</p>
      <p>Your 6-digit verification code (OTP) is:</p>
      <div style="margin: 20px 0; background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e293b; border: 1px dashed #cbd5e1;">
        ${otp}
      </div>
      <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 10 minutes. If you did not initiate this request, simply ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b;">This is an automated administrative notification.</p>
    </div>
  `;

  const result = await sendMailHelper({ to: email, subject: title, text: body, html });
  if (result.simulated) {
    return { success: true, simulated: true, otp };
  }
  return result;
};



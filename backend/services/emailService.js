import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("\n========================================================");
    console.warn("⚠️  WARNING: SMTP Server settings are missing in your environment configuration! (.env)");
    console.warn("Outbound email transmission fell back to local terminal stdout stream.");
    console.warn("========================================================\n");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465,
    auth: { user, pass },
  });
};

export const sendWelcomeEmail = async (email, name) => {
  const from = process.env.SMTP_FROM || "no-reply@scas.edu";
  const transporter = getTransporter();

  const title = "Welcome to SCAS Ledger!";
  const body = `Hello ${name},\n\nWelcome to the Smart Classroom Analytics System! Your institutional account is register-coded successfully under the email address: ${email}.\n\nExplore courses and audit modern attendance analytics securely.\n\nWarm regards,\nSCAS Ledger Administration`;

  if (!transporter) {
    console.log(`\n📬 [OUTBOUND EMAIL SIMULATION] Welcome Email To: ${email}\nSubject: ${title}\nBody:\n${body}\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: title,
      text: body,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #2563eb;">SCAS Ledger</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Welcome to the Smart Classroom Analytics System (SCAS)! Your account stands registered successfully.</p>
          <p>Registered Email: <code>${email}</code></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This email was sent from an automated administrative script.</p>
        </div>
      `,
    });
    console.log(`📬 Welcome email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to transmit welcome email to ${email}: ${error.message}`);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, resetUrl, resetToken) => {
  const from = process.env.SMTP_FROM || "no-reply@scas.edu";
  const transporter = getTransporter();

  const title = "SCAS Identity Key Ledger Recovery Verification";
  const body = `Hello,\n\nWe received a command request to reset your SCAS account password.\nUse the following link to assign new access credentials:\n${resetUrl}\n\nSecurity token: ${resetToken}\n\nIf you did not issue this security reset ticket, ignore this message safely.\n\nSCAS Security Desk`;

  if (!transporter) {
    console.log(`\n📬 [OUTBOUND EMAIL SIMULATION] Password Reset to: ${email}\nSubject: ${title}\nReset URL: ${resetUrl}\nReset Token: ${resetToken}\n`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: title,
      text: body,
      html: `
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
      `,
    });
    console.log(`📬 Password Reset email dispatched with success to ${email}`);
    return { success: true, simulated: false };
  } catch (error) {
    console.error(`❌ Failed to transmit reset email to ${email}: ${error.message}`);
    return { success: false, simulated: false, error: error.message };
  }
};

export const sendOTPEmail = async (email, otp) => {
  const from = process.env.SMTP_FROM || "no-reply@scas.edu";
  const transporter = getTransporter();

  const title = "SCAS Account Registration Verification Code";
  const body = `Hello,\n\nYour Smart Classroom Analytics System (SCAS) account registration verification code is: ${otp}.\n\nThis verification code is valid for 10 minutes.\n\nWarm regards,\nSCAS Ledger Administration`;

  if (!transporter) {
    console.log(`\n📬 [OUTBOUND EMAIL SIMULATION] OTP Verification Email To: ${email}\nSubject: ${title}\nOTP: ${otp}\n`);
    return { success: true, simulated: true, otp };
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: title,
      text: body,
      html: `
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
      `,
    });
    console.log(`📬 OTP Verification email dispatched to ${email}`);
    return { success: true, simulated: false };
  } catch (error) {
    console.error(`❌ Failed to transmit OTP email to ${email}: ${error.message}`);
    return { success: false, simulated: false, error: error.message };
  }
};


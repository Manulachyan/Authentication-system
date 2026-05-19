import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: false,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

const sendMail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: ENV.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${ENV.CLIENT_URL}/verify-email/${token}`;
  await sendMail(
    email,
    'Verify Your Email',
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Email Verification</h2>
      <p>Click the button below to verify your email address.</p>
      <a href="${url}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, ignore this email.</p>
    </div>
    `
  );
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const url = `${ENV.CLIENT_URL}/reset-password/${token}`;
  await sendMail(
    email,
    'Reset Your Password',
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Password Reset</h2>
      <p>Click the button below to reset your password.</p>
      <a href="${url}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
    `
  );
};

export const sendMagicLinkEmail = async (email: string, token: string) => {
  const url = `${ENV.CLIENT_URL}/magic-link/verify/${token}`;
  await sendMail(
    email,
    'Your One-Time Login Link',
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2>Magic Login Link</h2>
      <p>Click the button below to log in instantly. This link can only be used once.</p>
      <a href="${url}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
        Log In Now
      </a>
      <p>This link expires in 10 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
    `
  );
};

export const sendSuspiciousLoginEmail = async (
  email: string,
  deviceInfo: { ip: string; browser: string; os: string }
) => {
  await sendMail(
    email,
    'Suspicious Login Detected',
    `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#ef4444">⚠️ Suspicious Login Alert</h2>
      <p>We detected a login from a new location or device.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0">
        <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">IP Address</td><td style="padding:8px">${deviceInfo.ip}</td></tr>
        <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">Browser</td><td style="padding:8px">${deviceInfo.browser}</td></tr>
        <tr><td style="padding:8px;background:#f3f4f6;font-weight:bold">OS</td><td style="padding:8px">${deviceInfo.os}</td></tr>
      </table>
      <p>If this was you, no action needed. If not, please reset your password immediately.</p>
    </div>
    `
  );
}; 
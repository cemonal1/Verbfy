import nodemailer from 'nodemailer';
import { createLogger } from '../utils/logger';
const emailLogger = createLogger('Email');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!process.env.SMTP_HOST) {
    emailLogger.warn('SMTP not configured; skipping email to', to);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@verbfy.com',
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    html,
  });
}



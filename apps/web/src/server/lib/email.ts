import { env } from '../config/env';
import logger from './logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

let nodemailer: typeof import('nodemailer') | null = null;

async function getTransporter() {
  if (!nodemailer) {
    try {
      nodemailer = await import('nodemailer');
    } catch {
      return null;
    }
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
      : undefined,
  });
}

const emailService = {
  async send(options: SendEmailOptions): Promise<void> {
    const transporter = await getTransporter();
    if (!transporter) {
      logger.warn('SMTP not configured — email not sent', { to: options.to, subject: options.subject });
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@barberpro.ru',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    logger.info('Email sent', { to: options.to, subject: options.subject });
  },

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${env.APP_URL}/auth/verify-email?token=${token}`;
    await this.send({
      to: email,
      subject: 'Подтверждение email — BarberPro',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:Inter,sans-serif;color:#F5F0EB;background:#0A0A0B;padding:32px;border-radius:12px;">
          <h1 style="font-family:serif;color:#C9A96E;">BarberPro</h1>
          <h2 style="font-size:20px;margin:16px 0;">Подтвердите ваш email</h2>
          <p style="color:#6B6560;line-height:1.5;">Нажмите на кнопку ниже, чтобы подтвердить ваш email адрес:</p>
          <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 32px;border-radius:12px;background:#C9A96E;color:#0A0A0B;text-decoration:none;font-weight:600;">
            Подтвердить email
          </a>
          <p style="color:#6B6560;font-size:12px;">Ссылка действительна 24 часа. Если вы не регистрировались — проигнорируйте это письмо.</p>
        </div>
      `,
    });
  },

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const url = `${env.APP_URL}/auth/reset-password?token=${token}`;
    await this.send({
      to: email,
      subject: 'Сброс пароля — BarberPro',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:Inter,sans-serif;color:#F5F0EB;background:#0A0A0B;padding:32px;border-radius:12px;">
          <h1 style="font-family:serif;color:#C9A96E;">BarberPro</h1>
          <h2 style="font-size:20px;margin:16px 0;">Сброс пароля</h2>
          <p style="color:#6B6560;line-height:1.5;">Нажмите на кнопку ниже, чтобы установить новый пароль:</p>
          <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 32px;border-radius:12px;background:#C9A96E;color:#0A0A0B;text-decoration:none;font-weight:600;">
            Сбросить пароль
          </a>
          <p style="color:#6B6560;font-size:12px;">Ссылка действительна 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.</p>
        </div>
      `,
    });
  },
};

export { emailService };

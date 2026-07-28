import { env } from '../config/env';
import logger from './logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const emailService = {
  async send(options: SendEmailOptions): Promise<void> {
    logger.info('Email would be sent', { to: options.to, subject: options.subject });

    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with actual email provider (SendGrid, SES, etc.)
      logger.warn('Email sending not configured — using logger only');
    }
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

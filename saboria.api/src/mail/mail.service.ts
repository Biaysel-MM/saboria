import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Envío de correos (código de verificación de cuenta).
 *
 * Si SMTP_HOST está configurado se envía el correo real con nodemailer.
 * Sin SMTP (desarrollo) el código se imprime en la consola del backend y se
 * devuelve en `devCode` para poder probar sin servidor de correo.
 */
@Injectable()
export class MailService {
  private readonly logger = new MailServiceLogger();
  private readonly transporter: nodemailer.Transporter | null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') ?? 587),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER') ?? '',
          pass: this.config.get<string>('SMTP_PASS') ?? '',
        },
      });
    } else {
      this.transporter = null;
      this.logger.log(
        'SMTP_HOST no configurado: los códigos de verificación se muestran en la consola (modo desarrollo).',
      );
    }
  }

  get isDevMode(): boolean {
    return this.transporter === null;
  }

  /** Envía el código de verificación. Devuelve `devCode` solo sin SMTP. */
  async sendVerificationCode(
    email: string,
    fullName: string,
    code: string,
  ): Promise<{ devCode?: string }> {
    if (!this.transporter) {
      this.logger.log(`[dev] Código para ${email}: ${code}`);
      return { devCode: code };
    }

    const from =
      this.config.get<string>('MAIL_FROM') ?? 'Saboria <no-reply@saboria.do>';
    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Tu código de verificación de Saboria',
      text:
        `Hola ${fullName}, tu código de verificación es: ${code}\n\n` +
        'Caduca en 15 minutos. Si no creaste esta cuenta, ignora este correo.',
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:auto">
          <h2 style="color:#241a17">Hola ${fullName}</h2>
          <p>Usa este código para activar tu cuenta de Saboria:</p>
          <p style="font-size:28px;letter-spacing:8px;font-weight:bold;
                    background:#fffaf3;padding:14px;text-align:center;
                    border-radius:12px;color:#e8467c">${code}</p>
          <p style="color:#777;font-size:13px">
            Caduca en 15 minutos. Si no creaste esta cuenta, ignora este correo.
          </p>
        </div>`,
    });
    return {};
  }
}

/** Logger propio para no depender del contexto de Nest en este servicio. */
class MailServiceLogger {
  private readonly logger = new Logger('Mail');
  log(message: string) {
    this.logger.log(message);
  }
}

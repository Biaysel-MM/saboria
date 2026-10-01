import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const CODE_TTL_MS = 15 * 60 * 1000;

export type UserRole = 'cliente' | 'admin';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  // ------------------------------------------------------------ registro

  /**
   * Crea la cuenta DESACTIVADA (emailVerified=false) y envía un código de
   * 6 dígitos. Hasta verificar, el login la rechaza.
   */
  async register(dto: {
    fullName: string;
    email: string;
    password: string;
  }) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });

    if (existing?.emailVerified) {
      throw new ConflictException('Este correo ya tiene una cuenta');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const code = this.newCode();

    // Cuenta pendiente (o re-registro antes de verificar): se sobrescribe.
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            fullName: dto.fullName.trim(),
            passwordHash,
            verifyCode: code,
            verifyCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
          },
        })
      : await this.prisma.user.create({
          data: {
            email,
            fullName: dto.fullName.trim(),
            passwordHash,
            role: 'cliente',
            emailVerified: false,
            verifyCode: code,
            verifyCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
          },
        });

    const { devCode } = await this.mail.sendVerificationCode(
      email,
      user.fullName,
      code,
    );

    return {
      requiresVerification: true,
      email,
      // Solo en desarrollo (sin SMTP): permite probar el flujo completo.
      ...(devCode ? { devCode } : {}),
    };
  }

  /** Confirma el código: activa la cuenta y devuelve sesión (login directo). */
  async verifyCode(dto: { email: string; code: string }) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
      throw new NotFoundException('No hay ninguna cuenta pendiente de verificar');
    }
    if (
      !user.verifyCode ||
      !user.verifyCodeExpiresAt ||
      user.verifyCodeExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('El código expiró. Solicita uno nuevo.');
    }
    if (user.verifyCode !== dto.code.trim()) {
      throw new BadRequestException('El código no es correcto');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyCode: null,
        verifyCodeExpiresAt: null,
        lastLoginAt: new Date(),
      },
    });

    return this.session(user.id);
  }

  /** Reenvía un código nuevo a una cuenta pendiente. */
  async resendCode(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
      // No revelar si la cuenta existe o ya está verificada.
      return { sent: true };
    }

    const code = this.newCode();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verifyCode: code,
        verifyCodeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });
    const { devCode } = await this.mail.sendVerificationCode(
      email,
      user.fullName,
      code,
    );
    return { sent: true, ...(devCode ? { devCode } : {}) };
  }

  // -------------------------------------------------------------- login

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Debes verificar tu correo antes de entrar',
      );
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta está desactivada');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.session(user.id);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException();

    return this.publicUser(user);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid)
      throw new UnauthorizedException('La contraseña actual es incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { success: true };
  }

  // ------------------------------------------------------------- helpers

  private session(userId: number) {
    // El rol viaja en el token para que los guards no consulten en cada petición.
    return this.prisma.user
      .findUniqueOrThrow({ where: { id: userId } })
      .then((user) => ({
        token: this.jwt.sign({
          sub: user.id,
          email: user.email,
          role: user.role,
        }),
        user: this.publicUser(user),
      }));
  }

  private publicUser(user: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
    };
  }

  private newCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}

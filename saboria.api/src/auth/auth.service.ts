import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin || !(await bcrypt.compare(dto.password, admin.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!admin.isActive)
      throw new UnauthorizedException('Esta cuenta está desactivada');

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.jwt.sign({ sub: admin.id, email: admin.email });
    return {
      token,
      user: { id: admin.id, email: admin.email, fullName: admin.fullName },
    };
  }

  async me(userId: number) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: userId },
    });
    if (!admin) throw new NotFoundException();

    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
    };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: userId },
    });
    if (!admin) throw new NotFoundException();

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid)
      throw new UnauthorizedException('La contraseña actual es incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    return { success: true };
  }
}

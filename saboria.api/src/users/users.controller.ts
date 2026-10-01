import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

class UpdateUserDto {
  @IsOptional()
  @IsIn(['cliente', 'admin'])
  role?: 'cliente' | 'admin';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Lista de usuarios para el panel (sin datos sensibles). */
@UseGuards(AdminGuard)
@Controller('api/admin')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  async users() {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { reviews: true } },
      },
    });
    return rows.map((u) => ({
      ...u,
      reviewCount: u._count.reviews,
      _count: undefined,
    }));
  }

  /** Cambia rol (cliente/admin) y/o estado (activo/suspendido) de un usuario. */
  @Put('users/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() admin: RequestUser,
  ) {
    if (dto.role === undefined && dto.isActive === undefined) {
      throw new BadRequestException('No hay cambios que aplicar');
    }
    if (id === admin.userId && dto.role === 'cliente') {
      throw new ForbiddenException('No puedes quitar tu propio rol de admin');
    }
    if (id === admin.userId && dto.isActive === false) {
      throw new ForbiddenException('No puedes suspenderte a ti mismo');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('El usuario no existe');

    // Nunca dejar el sistema sin al menos un admin activo.
    if (
      (dto.role === 'cliente' || dto.isActive === false) &&
      user.role === 'admin'
    ) {
      const otherAdmins = await this.prisma.user.count({
        where: {
          role: 'admin',
          isActive: true,
          emailVerified: true,
          id: { not: id },
        },
      });
      if (otherAdmins === 0) {
        throw new ForbiddenException(
          'Debe quedar al menos un administrador activo',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        isActive: true,
      },
    });
    return updated;
  }
}

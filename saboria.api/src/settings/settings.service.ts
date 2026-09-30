import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const settings = await this.prisma.siteSetting.findFirst();
    if (!settings)
      throw new NotFoundException(
        'Falta el seed de textos (ejecuta: npm run db:seed)',
      );
    return settings;
  }

  async update(dto: UpdateSettingsDto) {
    const current = await this.get();
    return this.prisma.siteSetting.update({
      where: { id: current.id },
      data: dto,
    });
  }
}

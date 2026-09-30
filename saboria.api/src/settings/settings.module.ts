import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsService } from './settings.service';
import { SettingsAdminController, SettingsController } from './settings.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController, SettingsAdminController],
  providers: [SettingsService],
})
export class SettingsModule {}

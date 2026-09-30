import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogService } from './catalog.service';
import {
  CatalogAdminController,
  MenuController,
} from './catalog.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MenuController, CatalogAdminController],
  providers: [CatalogService],
})
export class CatalogModule {}

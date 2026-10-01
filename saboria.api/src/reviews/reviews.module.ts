import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  ReviewsAdminController,
  ReviewsController,
  ReviewsUserController,
} from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ReviewsController,
    ReviewsUserController,
    ReviewsAdminController,
  ],
  providers: [ReviewsService],
})
export class ReviewsModule {}

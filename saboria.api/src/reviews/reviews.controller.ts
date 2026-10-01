import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/jwt.strategy';
import { ReviewsService } from './reviews.service';

class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

class ModerateDto {
  @IsString()
  @IsIn(['hide', 'show'])
  action!: 'hide' | 'show';
}

class ReplyDto {
  @IsString()
  @MaxLength(1000)
  comment!: string;
}

// -------------------------------------------------------------- público
@Controller('api')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Reseñas visibles de un producto + promedio + (si hay sesión) la mía. */
  @Get('products/:id/reviews')
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: RequestUser,
  ) {
    return this.reviews.listVisible(id, user?.userId);
  }
}

// ---------------------------------------------------------- con sesión
@UseGuards(JwtAuthGuard)
@Controller('api')
export class ReviewsUserController {
  constructor(private readonly reviews: ReviewsService) {}

  /** La reseña del usuario actual para este producto (o null). */
  @Get('products/:id/reviews/mine')
  mine(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reviews.findMine(id, user.userId);
  }

  /** Crea o actualiza la reseña propia (una por producto). */
  @Post('products/:id/reviews')
  upsert(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reviews.upsert(id, user.userId, dto.rating, dto.comment);
  }

  /** Responde a una reseña (plano, un solo nivel; varias permitidas). */
  @Post('reviews/:id/replies')
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reviews.addReply(id, user.userId, dto.comment);
  }

  /** Borra la reseña propia (o la respuesta propia). */
  @Delete('reviews/:id')
  removeOwn(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reviews.remove(id, user.userId, user.role === 'admin');
  }
}

// ---------------------------------------------------------------- admin
@UseGuards(AdminGuard)
@Controller('api/admin')
export class ReviewsAdminController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Todas las reseñas (visibles y ocultas) para moderación. */
  @Get('reviews')
  all(@Query('productId') productId?: string) {
    const id = productId ? Number(productId) : undefined;
    return this.reviews.listAll(
      Number.isFinite(id) ? (id as number) : undefined,
    );
  }

  /** Oculta o muestra una reseña (no la borra). */
  @Put('reviews/:id/moderate')
  moderate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModerateDto,
  ) {
    return this.reviews.setHidden(id, dto.action === 'hide');
  }

  /** Borrado definitivo (el admin lo confirma). */
  @Delete('reviews/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviews.remove(id, undefined, true);
  }
}

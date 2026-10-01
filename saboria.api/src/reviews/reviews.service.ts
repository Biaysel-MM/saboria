import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const reviewInclude = {
  user: { select: { id: true, fullName: true } },
  product: { select: { id: true, name: true, emoji: true } },
} as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Reseñas visibles de un producto + resumen + la del usuario actual. */
  async listVisible(productId: number, viewerId?: number) {
    await this.ensureProduct(productId);

    const [rows, agg, mine] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isHidden: false },
        orderBy: { createdAt: 'desc' },
        include: reviewInclude,
      }),
      this.prisma.review.aggregate({
        where: { productId, isHidden: false },
        _avg: { rating: true },
        _count: true,
      }),
      viewerId
        ? this.prisma.review.findUnique({
            where: { productId_userId: { productId, userId: viewerId } },
          })
        : null,
    ]);

    return {
      reviews: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: r.user,
      })),
      summary: {
        avg: agg._avg.rating ?? 0,
        count: agg._count,
      },
      mine: mine && !mine.isHidden ? mine : null,
    };
  }

  async findMine(productId: number, userId: number) {
    const mine = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    return mine ?? null;
  }

  /** Crea o actualiza la reseña propia (máx. una por producto). */
  async upsert(productId: number, userId: number, rating: number, comment?: string) {
    await this.ensureProduct(productId);

    const text = comment?.trim() ? comment.trim() : null;
    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    // Una reseña oculta por moderación no se "resucita" reenviándola.
    if (existing?.isHidden) {
      throw new BadRequestException(
        'Tu reseña está en revisión por el administrador',
      );
    }

    const review = existing
      ? await this.prisma.review.update({
          where: { id: existing.id },
          data: { rating, comment: text, isHidden: false },
        })
      : await this.prisma.review.create({
          data: { productId, userId, rating, comment: text },
        });

    const agg = await this.prisma.review.aggregate({
      where: { productId, isHidden: false },
      _avg: { rating: true },
      _count: true,
    });

    return {
      review,
      summary: { avg: agg._avg.rating ?? 0, count: agg._count },
    };
  }

  /** Borra una reseña: propio userId, o cualquiera si es admin. */
  async remove(reviewId: number, userId: number | undefined, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('La reseña no existe');

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('Solo puedes borrar tus propias reseñas');
    }

    await this.prisma.review.delete({ where: { id: reviewId } });
    return { success: true };
  }

  // ---------------------------------------------------------------- admin

  async listAll(productId?: number) {
    return this.prisma.review.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        ...reviewInclude,
        product: {
          select: {
            id: true,
            name: true,
            emoji: true,
            tag: true,
            imageUrl: true,
            category: { select: { imageUrl: true } },
          },
        },
      },
    });
  }

  async setHidden(reviewId: number, hidden: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('La reseña no existe');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: hidden },
    });
  }

  // ------------------------------------------------------------- helpers

  private async ensureProduct(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('El producto no existe');
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const userSelect = { select: { id: true, fullName: true } } as const;

const reviewInclude = {
  user: userSelect,
  product: { select: { id: true, name: true, emoji: true } },
} as const;

/** Respuestas visibles de una reseña (más antiguas primero). */
const repliesVisible = {
  where: { isHidden: false },
  orderBy: { createdAt: 'asc' as const },
  include: { user: userSelect },
};

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Reseñas visibles de un producto + resumen + la del usuario actual.
   *  Incluye las respuestas visibles de cada reseña (un solo nivel). */
  async listVisible(productId: number, viewerId?: number) {
    await this.ensureProduct(productId);

    const [rows, agg, mine] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isHidden: false, parentId: null },
        orderBy: { createdAt: 'desc' },
        include: { ...reviewInclude, replies: repliesVisible },
      }),
      this.prisma.review.aggregate({
        where: { productId, isHidden: false, parentId: null },
        _avg: { rating: true },
        _count: true,
      }),
      viewerId
        ? this.prisma.review.findFirst({
            where: { productId, userId: viewerId, parentId: null },
            include: { replies: repliesVisible },
          })
        : null,
    ]);

    return {
      reviews: rows.map((r) => this.mapReview(r)),
      summary: {
        avg: agg._avg.rating ?? 0,
        count: agg._count,
      },
      mine: mine && !mine.isHidden ? this.mapReview(mine) : null,
    };
  }

  async findMine(productId: number, userId: number) {
    const mine = await this.prisma.review.findFirst({
      where: { productId, userId, parentId: null },
    });
    return mine ?? null;
  }

  /** Crea o actualiza la reseña propia (una principal por producto). */
  async upsert(productId: number, userId: number, rating: number, comment?: string) {
    await this.ensureProduct(productId);

    const text = comment?.trim() ? comment.trim() : null;
    const existing = await this.prisma.review.findFirst({
      where: { productId, userId, parentId: null },
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
      where: { productId, isHidden: false, parentId: null },
      _avg: { rating: true },
      _count: true,
    });

    return {
      review,
      summary: { avg: agg._avg.rating ?? 0, count: agg._count },
    };
  }

  /** Publica una respuesta plana a una reseña visible (un solo nivel).
   *  Cualquiera con sesión puede responder, incluido el autor de la reseña. */
  async addReply(reviewId: number, userId: number, comment?: string) {
    const text = comment?.trim();
    if (!text) throw new BadRequestException('La respuesta no puede estar vacía');

    const parent = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    // Solo se responde a reseñas principales visibles (sin anidar más).
    if (!parent || parent.parentId !== null || parent.isHidden) {
      throw new NotFoundException('La reseña no existe o está oculta');
    }

    const reply = await this.prisma.review.create({
      data: {
        productId: parent.productId,
        parentId: parent.id,
        userId,
        rating: null,
        comment: text,
      },
      include: { user: userSelect },
    });

    return { reply: this.mapReply(reply) };
  }

  /** Borra una reseña o respuesta: propio userId, o cualquiera si es admin. */
  async remove(reviewId: number, userId: number | undefined, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('La reseña no existe');

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException(
        review.parentId !== null
          ? 'Solo puedes borrar tus propias respuestas'
          : 'Solo puedes borrar tus propias reseñas',
      );
    }

    // Borrar una reseña principal borra sus respuestas (onDelete: Cascade).
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { success: true };
  }

  // ---------------------------------------------------------------- admin

  /** Reseñas principales (visibles y ocultas) con sus respuestas anidadas. */
  async listAll(productId?: number) {
    const rows = await this.prisma.review.findMany({
      where: {
        parentId: null,
        ...(productId ? { productId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        ...reviewInclude,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: userSelect },
        },
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
    return rows.map((r) => ({
      ...this.mapReview(r),
      product: r.product,
    }));
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

  private mapReview(r: any) {
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      isHidden: r.isHidden,
      createdAt: r.createdAt,
      user: r.user,
      replies: (r.replies ?? []).map((x: any) => this.mapReply(x)),
    };
  }

  private mapReply(r: any) {
    return {
      id: r.id,
      comment: r.comment,
      isHidden: r.isHidden,
      createdAt: r.createdAt,
      user: r.user,
    };
  }

  private async ensureProduct(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('El producto no existe');
  }
}

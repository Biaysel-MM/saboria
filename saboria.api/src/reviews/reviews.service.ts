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

  /** Reseñas visibles de un producto + resumen. Cada reseña incluye las
   *  respuestas visibles (un solo nivel). Un usuario puede tener varias. */
  async listVisible(productId: number) {
    await this.ensureProduct(productId);

    const [rows, agg] = await Promise.all([
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
    ]);

    return {
      reviews: rows.map((r) => this.mapReview(r)),
      summary: {
        avg: agg._avg.rating ?? 0,
        count: agg._count,
      },
    };
  }

  /** Todas las reseñas principales del usuario en este producto. */
  async findMine(productId: number, userId: number) {
    const rows = await this.prisma.review.findMany({
      where: { productId, userId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: { replies: repliesVisible },
    });
    return rows.map((r) => this.mapReview(r));
  }

  /** Publica una reseña nueva: se permiten varias por usuario y producto. */
  async create(productId: number, userId: number, rating: number, comment?: string) {
    await this.ensureProduct(productId);

    const review = await this.prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        comment: comment?.trim() ? comment.trim() : null,
      },
    });

    return { review, summary: await this.summaryOf(productId) };
  }

  /** Edita una reseña propia por id (sin tocar su moderación). */
  async update(reviewId: number, userId: number, rating: number, comment?: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('La reseña no existe');
    if (review.userId !== userId) {
      throw new ForbiddenException('Solo puedes editar tus propias reseñas');
    }
    if (review.parentId !== null) {
      throw new BadRequestException('Una respuesta no lleva calificación');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { rating, comment: comment?.trim() ? comment.trim() : null },
    });

    return { review: updated, summary: await this.summaryOf(review.productId) };
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

  /** Promedio y total de reseñas visibles (sin respuestas) del producto. */
  private async summaryOf(productId: number) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, isHidden: false, parentId: null },
      _avg: { rating: true },
      _count: true,
    });
    return { avg: agg._avg.rating ?? 0, count: agg._count };
  }

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

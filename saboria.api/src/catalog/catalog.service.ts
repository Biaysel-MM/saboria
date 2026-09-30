import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

// Prisma 7.10 exige orderBy como array (un objeto simple lanza
// "Expected ...Input[]").
const productOrder = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }];

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------ público

  /** Datos de la página: productos activos + categorías activas + textos. */
  async getBootstrap() {
    const [products, categories, settings] = await Promise.all([
      this.prisma.product.findMany({
        where: { isActive: true },
        orderBy: productOrder,
        include: { category: { select: { name: true } } },
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        orderBy: productOrder,
      }),
      this.prisma.siteSetting.findFirst(),
    ]);

    return { products, categories, settings };
  }

  // -------------------------------------------------------- admin: productos

  listProducts() {
    return this.prisma.product.findMany({
      orderBy: productOrder,
      include: { category: { select: { name: true } } },
    });
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...dto,
        tag: await this.tagFor(dto.categoryId, dto.tag),
        categoryId: dto.categoryId ?? null,
        emoji: dto.emoji || '🍽️',
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
      },
    });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    await this.ensureProduct(id);
    // `categoryId` solo viaja si el cliente lo envió: null desasigna,
    // ausente (undefined) lo conserva. El tag ("tipo") siempre sigue a la
    // categoría: si cambia la categoría, cambia la etiqueta.
    const data: Record<string, unknown> = { ...dto };
    if (dto.categoryId) {
      data.tag = await this.tagFor(dto.categoryId, dto.tag);
    }
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  /** Borrado físico (el admin lo confirma). */
  async deleteProduct(id: number) {
    await this.ensureProduct(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  /** Reordenar: recibe los ids en su nuevo orden y les asigna sortOrder. */
  async reorderProducts(ids: number[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.product.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return { success: true };
  }

  // ------------------------------------------------------ admin: categorías

  listCategories() {
    return this.prisma.category.findMany({ orderBy: productOrder });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...dto,
        emoji: dto.emoji || '🍽️',
        imageUrl: dto.imageUrl || null,
        note: dto.note ?? null,
      },
    });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.ensureCategory(id);
    const data: Record<string, unknown> = {
      ...dto,
      note: dto.note === undefined ? undefined : dto.note || null,
      imageUrl:
        dto.imageUrl === undefined ? undefined : dto.imageUrl || null,
    };
    // Si se renombra la categoría, sus productos heredan el nuevo nombre
    // como etiqueta ("tipo" unificado con categoría).
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({ where: { id }, data });
      if (dto.name) {
        await tx.product.updateMany({
          where: { categoryId: id },
          data: { tag: dto.name },
        });
      }
      return updated;
    });
  }

  async deleteCategory(id: number) {
    await this.ensureCategory(id);
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  // ----------------------------------------------------------------- utils

  /** El tag ("tipo") del producto es el nombre de su categoría. */
  private async tagFor(categoryId?: number | null, fallback?: string) {
    if (categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });
      if (cat) return cat.name;
    }
    return fallback?.trim() || 'Especialidades';
  }

  private async ensureProduct(id: number) {
    const found = await this.prisma.product.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Producto no encontrado');
    return found;
  }

  private async ensureCategory(id: number) {
    const found = await this.prisma.category.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Categoría no encontrada');
    return found;
  }
}

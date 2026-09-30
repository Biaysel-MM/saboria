import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsArray, IsInt } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

/** Carpeta persistente de imágenes (fuera de dist/ para sobrevivir builds). */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** Debe declararse ANTES de los controladores: emitDecoratorMetadata lo
 *  referencia en tiempo de evaluación del módulo (TDZ si va al final). */
class ReorderDto {
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];
}

// ---------------------------------------------------------------- público
@Controller('api')
export class MenuController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('bootstrap')
  bootstrap() {
    return this.catalogService.getBootstrap();
  }
}

// ------------------------------------------------------------------- admin
@UseGuards(JwtAuthGuard)
@Controller('api/admin')
export class CatalogAdminController {
  constructor(private readonly catalogService: CatalogService) {}

  // productos
  @Get('products')
  products() {
    return this.catalogService.listProducts();
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @Put('products/order')
  reorder(@Body() dto: ReorderDto) {
    return this.catalogService.reorderProducts(dto.ids);
  }

  @Put('products/:id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.deleteProduct(id);
  }

  // categorías
  @Get('categories')
  categories() {
    return this.catalogService.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.deleteCategory(id);
  }

  // subida de imágenes desde la computadora (deben ir sin fondo: PNG)
  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok =
          /^image\/(jpe?g|png|webp|gif)$/i.test(file.mimetype) &&
          IMAGE_EXTENSIONS.has(extname(file.originalname).toLowerCase());
        if (ok) return cb(null, true);
        return cb(
          new BadRequestException(
            'Solo se aceptan imágenes JPG, PNG, WEBP o GIF (máx. 5 MB)',
          ),
          false,
        );
      },
    }),
  )
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No se recibió ningún archivo (campo "file")',
      );
    }
    return { url: `/uploads/${file.filename}` };
  }
}

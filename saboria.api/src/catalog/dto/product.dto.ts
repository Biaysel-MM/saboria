import {
  IsBoolean,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  // "Tipo" unificado con la categoría: si no llega, el service deriva
  // el tag del nombre de la categoría.
  @IsOptional()
  @IsString()
  @MaxLength(60)
  tag?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsHexColor()
  c1!: string;

  @IsHexColor()
  c2!: string;

  @IsHexColor()
  c3!: string;

  @IsHexColor()
  accent!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  tag?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsHexColor()
  c1?: string;

  @IsOptional()
  @IsHexColor()
  c2?: string;

  @IsOptional()
  @IsHexColor()
  c3?: string;

  @IsOptional()
  @IsHexColor()
  accent?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

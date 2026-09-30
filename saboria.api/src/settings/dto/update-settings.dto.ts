import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  footerDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scheduleWeek?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scheduleSaturday?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  scheduleSunday?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  menuBadge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  menuTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  menuText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  catalogBadge?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  catalogTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  catalogText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  ctaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ctaText?: string;
}

import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { RequestUser } from './jwt.strategy';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Antifuerza bruta: solo el admin usa este endpoint.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.userId);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}

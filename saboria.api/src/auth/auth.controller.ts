import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { RequestUser } from './jwt.strategy';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

class RegisterDto {
  @IsString()
  @MinLength(2)
  @Length(2, 120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class VerifyCodeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}

class ResendCodeDto {
  @IsEmail()
  email!: string;
}

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

  // Antifuerza bruta / abuso de correos: límites por minuto.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify')
  verify(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('resend-code')
  resend(@Body() dto: ResendCodeDto) {
    return this.authService.resendCode(dto.email);
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

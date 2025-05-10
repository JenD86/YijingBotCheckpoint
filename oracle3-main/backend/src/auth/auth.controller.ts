import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TelegramAuthDto } from '../users/dto/telegram-auth.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  @Post('login')
  async login(@Body() telegramData: TelegramAuthDto) {
    // Validate the Telegram data using existing service method
    const isValid = await this.authService.validateTelegramUser(telegramData);

    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram authentication');
    }

    // Find or create user in database
    const user = await this.usersService.findOrCreate(
      telegramData.id,
      telegramData.username
    );

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.telegramId,
      username: user.username
    });

    // Return user info and token
    return {
      user,
      token
    };
  }
}
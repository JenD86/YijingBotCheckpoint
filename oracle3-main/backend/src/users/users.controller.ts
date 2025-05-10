import { Controller, Post, Body, Param, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../user.entity';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('telegram')
  async createUser(@Body() data: TelegramAuthDto): Promise<User> {
    if (await this.authService.validateTelegramUser(data)) {
      return this.usersService.findOrCreate(
        data.id,
        data.username
      );
    }
    throw new UnauthorizedException('Invalid Telegram authentication');
  }

  @Post(':telegramId/award-points')
  async awardPoints(
    @Param('telegramId', ParseIntPipe) telegramId: number
  ): Promise<User> {
    // Generate random points between 1 and 10
    const pointsToAward = Math.floor(Math.random() * 10) + 1;
    return this.usersService.addPoints(telegramId, pointsToAward);
  }

  @Get(':telegramId/points')
  async getUserPoints(
    @Param('telegramId', ParseIntPipe) telegramId: number
  ): Promise<{ points: number }> {
    const user = await this.usersService.findOrCreate(telegramId);
    return { points: user.points };
  }
}

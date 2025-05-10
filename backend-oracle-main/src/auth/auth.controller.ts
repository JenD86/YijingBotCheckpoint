import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('verify')
  verifyInitData(@Query('initData') initData: string): string {
    if (!initData) {
      throw new BadRequestException('initData is required');
    }

    const isValid = this.authService.verifyTelegramInitData(initData);

    if (!isValid) {
      throw new BadRequestException('Invalid initData');
    }

    return 'Authentication successful';
  }
}

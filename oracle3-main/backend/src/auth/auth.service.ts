import { Injectable } from '@nestjs/common';
import { TelegramAuthDto } from '../users/dto/telegram-auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;

  async validateTelegramUser(data: TelegramAuthDto): Promise<boolean> {
    const { hash, ...userData } = data;
    
    // Sort the object by key
    const dataCheckString = Object.keys(userData)
      .sort()
      .map(key => `${key}=${userData[key]}`)
      .join('\n');

    // Create data signature using bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    return signature === hash;
  }
}

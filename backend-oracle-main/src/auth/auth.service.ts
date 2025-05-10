import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly botToken: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('BOT_TOKEN');
  }

  verifyTelegramInitData(initData: string): boolean {
    const parsedData = Object.fromEntries(new URLSearchParams(initData));
    const { hash, ...dataToHash } = parsedData;

    const sortedData = Object.keys(dataToHash)
      .sort()
      .map((key) => `${key}=${dataToHash[key]}`)
      .join('\n');

    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedData)
      .digest('hex');

    return computedHash === hash;
  }
}


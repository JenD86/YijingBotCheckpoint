import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { DeepPartial } from 'typeorm';

@Injectable()
export class AuthService {
  private readonly botToken: string;

  constructor(private configService: ConfigService,
  @InjectRepository(User)
  private readonly userRepository: Repository<User>, // Inject the User repository
)  {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN'); // Provide a default value;
    if (!this.botToken) {
      throw new Error('Bot token is not configured in the environment variables');
    }
  }

  verifyTelegramInitData(initData: string): boolean {
    console.log('Bot token:', this.botToken);
    console.log('Received initData:', initData);
  
    const parsedData = Object.fromEntries(new URLSearchParams(initData));
    const { hash, ...dataToHash } = parsedData;
  
    const sortedData = Object.keys(dataToHash)
      .sort()
      .map((key) => `${key}=${dataToHash[key]}`)
      .join('\n');
    console.log('Sorted data to hash:', sortedData);
  
    const secretKey = crypto
      .createHash('sha256')
      .update(this.botToken)
      .digest();
  
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedData)
      .digest('hex');
  
    console.log('Computed hash:', computedHash);
    console.log('Received hash:', hash);
  
  // If hashes match, save the user to the database
  if (computedHash === hash) {
    this.saveUser(parsedData); // Save the user if authenticated
    return true;
  }

  return false;
}  
  
  
// Method to save the user data into the database
private async saveUser(data: Record<string, string>) {
    // Check if user already exists in the database
    const existingUser = await this.userRepository.findOne({
      where: { telegramId: data.id },
    });

    if (!existingUser) {
      // If the user does not exist, create a new user entity
      const newUser = this.userRepository.create({
        telegramId: data.id,
        firstName: data.first_name,
        lastName: data.last_name || null,
        username: data.username || null,
        authDate: new Date(Number(data.auth_date) * 1000), // Convert auth date from Unix timestamp
      } as DeepPartial<User>);

      // Save the new user to the database
      await this.userRepository.save(newUser);
      console.log('New user saved:', newUser);
    } else {
      console.log('User already exists:', existingUser);
        } 
    }
}
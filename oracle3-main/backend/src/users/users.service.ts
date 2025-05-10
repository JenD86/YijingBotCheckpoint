import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreate(telegramId: number, username?: string): Promise<User> {
    let user = await this.usersRepository.findOne({ 
      where: { telegramId } 
    });
    
    if (!user) {
      user = this.usersRepository.create({
        telegramId,
        username,
        points: 0
      });
      await this.usersRepository.save(user);
    } else if (user.username !== username) {
      // Update username if it has changed
      user.username = username;
      await this.usersRepository.save(user);
    }
    
    return user;
  }

  async updatePoints(telegramId: number, points: number): Promise<User> {
    await this.usersRepository.update(telegramId, { points });
    return this.usersRepository.findOne({ where: { telegramId } });
  }

  async addPoints(telegramId: number, pointsToAdd: number): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { telegramId } 
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    user.points += pointsToAdd;
    return this.usersRepository.save(user);
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Create or get user by username
  async getUser(username: string): Promise<User> {
    let user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      user = this.userRepository.create({ username, points: 0 });
      await this.userRepository.save(user);
    }

    return user;
  }

  // Add points to a user
  async addPoints(username: string, points: number): Promise<User> {
    const user = await this.getUser(username);
    user.points += points;
    return this.userRepository.save(user);
  }

  // add random points to the user
  async addRandomPoints(username: string): Promise<User> {
    const user = await this.getUser(username);
    const randomPoints = Math.floor(Math.random() * 10) + 1; // Random number between 1 and 10
    user.points += randomPoints;
    return this.userRepository.save(user);
  }

  // Convert points (example: convert points to some other currency)
  async convertPoints(username: string, conversionRate: number): Promise<string> {
    const user = await this.getUser(username);
    const convertedAmount = user.points * conversionRate;
    user.points = 0;  // Reset points after conversion
    await this.userRepository.save(user);

    return `Converted ${convertedAmount} (your points are now reset to 0)`;
  }
}

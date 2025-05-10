import { Controller, Get, Post, Param, Query, Body, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get user info (username and points)
  @Get(':username')
  async getUser(@Param('username') username: string) {
    const user = await this.userService.getUser(username);
    return { id: user.id, username: user.username, points: user.points };
  }

  // Add points to user
  @Post(':username/addPoints')
  async addPoints(
    @Param('username') username: string,
    @Body('points') points: number,
  ) {
    // Validate points
    if (typeof points !== 'number' || isNaN(points) || points < 0) {
      throw new BadRequestException('Points must be a positive number.');
    }

    const user = await this.userService.addPoints(username, points);
    return { username: user.username, points: user.points };
  }

  @Post(':username/addRandomPoints')
  async addRandomPoints(@Param('username') username: string) {
    const user = await this.userService.addRandomPoints(username);
    return { username: user.username, points: user.points };
  }


  // Convert user points
  @Post(':username/convertPoints')
  async convertPoints(
    @Param('username') username: string,
    @Body('conversionRate') conversionRate: number,
  ) {
    const result = await this.userService.convertPoints(username, conversionRate);
    return { message: result };
  }
}

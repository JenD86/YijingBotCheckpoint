import { Controller, Get, Param, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { LotteryService } from './lottery.service';

@Controller('lottery')
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  /**
   * Get all lottery tickets for a specific user
   * This endpoint returns both active and past tickets
   * GET /lottery/tickets/:userId
   */
  @Get('tickets/:userId')
  async getUserTickets(@Param('userId', ParseIntPipe) userId: number) {
    // The service will validate the user's existence and return their tickets
    return this.lotteryService.getTicketsByUser(userId);
  }

  /**
   * Get only active (future draw) tickets for a user
   * Active tickets are those that haven't been drawn yet
   * GET /lottery/tickets/:userId/active
   */
  @Get('tickets/:userId/active')
  async getActiveTickets(@Param('userId', ParseIntPipe) userId: number) {
    return this.lotteryService.getActiveTickets(userId);
  }

  /**
   * Get draw results for a specific date
   * If no date is provided, returns today's draw
   * GET /lottery/draws?date=YYYY-MM-DD
   */
  @Get('draws')
  async getDrawResults(@Query('date') dateStr: string) {
    let date: Date;
    
    if (dateStr) {
      // Parse and validate the provided date
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
      
      // Ensure the date isn't in the future
      const today = new Date();
      if (date > today) {
        throw new BadRequestException('Cannot retrieve future draw results');
      }
    } else {
      date = new Date();
    }
    
    return this.lotteryService.getDrawResults(date);
  }

  /**
   * Get information about today's upcoming draw
   * This includes the draw time and number of participating tickets
   * GET /lottery/today
   */
  @Get('today')
  async getTodayDraw() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const drawInfo = await this.lotteryService.getDrawResults(today);

    // Add additional information about the upcoming draw
    return {
      ...drawInfo,
      nextDrawTime: this.getNextDrawTime(),
      isDrawComplete: drawInfo?.winningTicketId !== null,
    };
  }

  /**
   * Verify the authenticity of a specific draw's results
   * This endpoint allows users to confirm the fairness of the draw
   * GET /lottery/verify/:drawId
   */
  @Get('verify/:drawId')
  async verifyDraw(@Param('drawId', ParseIntPipe) drawId: number) {
    return this.lotteryService.verifyDraw(drawId);
  }


  /**
   * Helper method to calculate the next draw time
   * @private
   * @returns Date object representing the next draw time
   */
  private getNextDrawTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
  }
}
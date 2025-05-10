import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { WalletGuard } from './walletGuard/wallet.guard';
import { IChingQuestionDto } from './dto/iching/iching-question.dto';
import { ExpandedAnswerDto } from './dto/iching/expanded-answer.dto';

@ApiTags('I Ching Fortune Telling')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Welcome endpoint' })
  @ApiResponse({ status: 200, description: 'Returns a welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('iching/ask')
  @ApiOperation({ summary: 'Get basic I Ching reading' })
  @ApiResponse({ 
    status: 201, 
    description: 'Returns a basic I Ching reading with hexagram interpretation'
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async getIChingFortune(@Body() questionDto: IChingQuestionDto) {
    return await this.appService.generateBasicFortune(questionDto);
  }

  @Post('iching/expand')
  @UseGuards(WalletGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get expanded I Ching reading',
    description: 'Requires wallet authentication and payment'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Returns detailed I Ching reading with full interpretation'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Payment required' })
  @ApiResponse({ status: 404, description: 'Hexagram reading not found' })
  async getExpandedFortune(@Body() expandDto: ExpandedAnswerDto) {
    return await this.appService.generateDetailedFortune(expandDto);
  }
}
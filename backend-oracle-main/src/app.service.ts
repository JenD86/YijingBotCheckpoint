import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { generateFortune, summarizeFortuneBasic, summarizeFortuneCot } from './fortuneGen/generate';
import { IChingQuestionDto } from './dto/iching/iching-question.dto';
import { ExpandedAnswerDto } from './dto/iching/expanded-answer.dto';
import { LotteryService } from './lottery/lottery.service';
import { UserService } from './user/user.service';

// Interface defining the structure of stored readings
interface StoredReading {
  userId: string;
  question: string;
  hexagramReading: string;
  timestamp: Date;
  hasReceivedTicket?: boolean;
}

@Injectable()
export class AppService {
  // In-memory storage for readings
  private readings: Map<string, StoredReading> = new Map();
  private claudeClient: Anthropic;

  constructor(
    private configService: ConfigService,
    private lotteryService: LotteryService,
  ) {
    // Initialize the Claude client with API key
    this.claudeClient = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  // Basic greeting endpoint
  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Generates a basic fortune reading without lottery ticket
   * @param questionDto Contains the user's question and ID
   * @returns Basic fortune interpretation and hexagram ID
   */
  async generateBasicFortune(questionDto: IChingQuestionDto) {
    console.log('\n=== NEW FORTUNE REQUEST ===');
    console.log('Question:', questionDto.question);
    console.log('User ID:', questionDto.userId);
  
    // Generate the hexagram based on the user's question
    const hexagramReading = generateFortune();
    console.log('\n=== GENERATED HEXAGRAM ===');
    console.log(hexagramReading);
  
    // Get basic interpretation from Claude
    console.log('\n=== REQUESTING BASIC INTERPRETATION ===');
    const basicInterpretation = await summarizeFortuneBasic(
      this.claudeClient,
      hexagramReading,
      questionDto.question 
    );
    console.log('\n=== BASIC INTERPRETATION ===');
    console.log(basicInterpretation);

    // Create unique ID for this reading
    const hexagramId = this.generateReadingId();

    // Store the reading for later expansion
    this.storeReading(hexagramId, {
      userId: questionDto.userId,
      question: questionDto.question,
      hexagramReading,
      timestamp: new Date(),
    });

    // Return basic reading data
    return {
      basicReading: basicInterpretation,
      hexagramId,
      timestamp: new Date(),
    };
  }

  /**
   * Generates a detailed fortune reading and awards a lottery ticket
   * @param expandDto Contains hexagram ID and user ID
   * @returns Detailed fortune reading and lottery ticket confirmation
   */
  async generateDetailedFortune(expandDto: ExpandedAnswerDto) {
    console.log('\n=== EXPANDED READING REQUEST ===');
    console.log('Hexagram ID:', expandDto.hexagramId);
    console.log('User ID:', expandDto.userId);
  
    // Retrieve the stored reading
    const storedReading = this.getStoredReading(expandDto.hexagramId);
    console.log('\n=== STORED READING ===');
    console.log(storedReading);
  
    // Verify reading ownership
    if (storedReading.userId !== expandDto.userId) {
      throw new NotFoundException('Reading not found for this user');
    }
  
    // Get detailed interpretation using Chain of Thought reasoning
    console.log('\n=== REQUESTING DETAILED INTERPRETATION ===');
    const detailedInterpretation = await summarizeFortuneCot(
      this.claudeClient,
      storedReading.hexagramReading,
      storedReading.question  // Add this parameter
    );
    console.log('\n=== DETAILED INTERPRETATION ===');
    console.log(detailedInterpretation);

    try {
      // Create a lottery ticket for the user
      const ticket = await this.lotteryService.createTicketForFortune(
        Number(expandDto.userId)
      );

      // Return detailed reading with lottery ticket confirmation
      return {
        question: storedReading.question,
        detailedReading: detailedInterpretation,
        fullHexagram: storedReading.hexagramReading,
        timestamp: storedReading.timestamp,
        lotteryTicket: {
          received: true,
          ticketId: ticket.id,
          drawDate: ticket.drawDate,
          message: "You've received a lottery ticket for the next draw!"
        }
      };
    } catch (error) {
      // If ticket creation fails, still return the fortune but with error message
      console.error('Failed to create lottery ticket:', error);
      return {
        question: storedReading.question,
        detailedReading: detailedInterpretation,
        fullHexagram: storedReading.hexagramReading,
        timestamp: storedReading.timestamp,
        lotteryTicket: {
          received: false,
          message: "Unable to generate lottery ticket at this time"
        }
      };
    }
  }

  /**
   * Retrieves all fortune readings and lottery tickets for a user
   * @param userId The user's ID
   * @returns User's fortune history and active lottery tickets
   */
  async getUserHistory(userId: string) {
    // Get all readings for this user
    const userReadings = Array.from(this.readings.entries())
      .filter(([_, reading]) => reading.userId === userId)
      .map(([id, reading]) => ({
        hexagramId: id,
        ...reading,
        hasLotteryTicket: reading.hasReceivedTicket
      }));

    // Get user's active lottery tickets
    const activeTickets = await this.lotteryService.getActiveTickets(Number(userId));

    return {
      readings: userReadings,
      activeTickets: activeTickets,
      totalReadings: userReadings.length,
      totalActiveTickets: activeTickets.length
    };
  }

  /**
   * Generates a unique reading ID
   * @private
   * @returns Unique hexagram ID
   */
  private generateReadingId(): string {
    return `hex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stores a reading in memory
   * @private
   * @param hexagramId Unique reading identifier
   * @param reading Reading data to store
   */
  private storeReading(hexagramId: string, reading: StoredReading): void {
    this.readings.set(hexagramId, reading);
  }

  /**
   * Retrieves a stored reading
   * @private
   * @param hexagramId ID of the reading to retrieve
   * @returns The stored reading data
   * @throws NotFoundException if reading not found
   */
  private getStoredReading(hexagramId: string): StoredReading {
    const reading = this.readings.get(hexagramId);
    if (!reading) {
      throw new NotFoundException('Reading not found');
    }
    return reading;
  }
}
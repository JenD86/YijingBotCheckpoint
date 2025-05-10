import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Web3 } from 'web3';

import { Ticket } from './ticket.entity';
import { Draw } from './draw.entity';
import { User } from '../user/user.entity';
import { selectWinner, getFirstHashAfterMidnight } from './lottery.selector';

@Injectable()
export class LotteryService {
    // Initialize logger for this service
    private readonly logger = new Logger(LotteryService.name);
    private web3: Web3;

    // Points awarded for winning the lottery
    private readonly WINNING_REWARD = 100;

    constructor(
        @InjectRepository(Ticket)
        private ticketRepository: Repository<Ticket>,
        @InjectRepository(Draw)
        private drawRepository: Repository<Draw>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        // Initialize Web3 connection
        this.web3 = new Web3(
            new Web3.providers.HttpProvider(
                process.env.INFURA_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
            )
        );
    }

    /**
     * Creates a lottery ticket when a user gets their detailed fortune reading
     * @param userId The ID of the user receiving the ticket
     * @returns Promise<Ticket> The created ticket
     */
    async createTicketForFortune(userId: number): Promise<Ticket> {
        // Find the user and verify they exist
        const user = await this.userRepository.findOne({ 
            where: { id: userId }
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Create and save the ticket
        const ticket = this.ticketRepository.create({
            user,
            drawDate: this.getNextDrawDate()
        });

        return await this.ticketRepository.save(ticket);
    }

    /**
     * Get the next draw date (next midnight UTC)
     * @private
     * @returns Date
     */
    private getNextDrawDate(): Date {
        const date = new Date();
        date.setUTCHours(24, 0, 0, 0);
        return date;
    }

    /**
     * Run the daily lottery draw
     * This is scheduled to run at midnight UTC every day
     * @private
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async runDailyDraw() {
        this.logger.log('Starting daily lottery draw...');

        try {
            const drawDate = new Date();
            drawDate.setUTCHours(0, 0, 0, 0);

            // Get all tickets for today's draw
            const tickets = await this.ticketRepository.find({
                where: {
                    drawDate: Between(
                        drawDate,
                        new Date(drawDate.getTime() + 24 * 60 * 60 * 1000)
                    ),
                },
                relations: ['user'],
            });

            if (tickets.length === 0) {
                this.logger.log('No tickets for today\'s draw');
                return;
            }

            // Run the lottery using blockchain data
            const drawTimestamp = Math.floor(drawDate.getTime() / 1000);
            const result = await selectWinner(tickets.length, drawTimestamp);

            // Create and save draw record
            const draw = this.drawRepository.create({
                drawDate,
                blockHash: result.blockHash,
                winningTicketId: tickets[result.winningTicketIndex].id,
                totalTickets: tickets.length,
            });

            await this.drawRepository.save(draw);

            // Update winning ticket and reward user
            const winningTicket = tickets[result.winningTicketIndex];
            winningTicket.isWinner = true;
            winningTicket.draw = draw;
            await this.ticketRepository.save(winningTicket);

            // Award points to winner
            const winner = winningTicket.user;
            winner.points += this.WINNING_REWARD;
            await this.userRepository.save(winner);

            this.logger.log(
                `Draw completed. Winner: ${winner.username}, ` +
                `Ticket: ${winningTicket.id}, ` +
                `Points awarded: ${this.WINNING_REWARD}`
            );
        } catch (error) {
            this.logger.error('Error running daily draw:', error);
            throw error;
        }
    }

    /**
     * Get draw results for a specific date
     * @param date The date to get results for
     * @returns Promise<Draw> The draw results
     */
    async getDrawResults(date: Date): Promise<Draw> {
        return this.drawRepository.findOne({
            where: {
                drawDate: Between(
                    date,
                    new Date(date.getTime() + 24 * 60 * 60 * 1000)
                ),
            },
            relations: ['tickets', 'tickets.user'],
        });
    }

    /**
     * Get all tickets for a specific user
     * @param userId The user's ID
     * @returns Promise<Ticket[]> Array of tickets
     */
    async getTicketsByUser(userId: number): Promise<Ticket[]> {
        const user = await this.userRepository.findOne({ 
            where: { id: userId }
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.ticketRepository.find({
            where: { user: { id: userId } },
            relations: ['draw'],
            order: { purchaseDate: 'DESC' },
        });
    }

    /**
     * Get active tickets for a user (tickets for future draws)
     * @param userId The user's ID
     * @returns Promise<Ticket[]> Array of active tickets
     */
    async getActiveTickets(userId: number): Promise<Ticket[]> {
        const now = new Date();
        return this.ticketRepository.find({
            where: {
                user: { id: userId },
                drawDate: LessThanOrEqual(now),
                isWinner: false,
            },
            relations: ['draw'],
            order: { drawDate: 'ASC' },
        });
    }

    /**
     * Verify the results of a specific draw
     * @param drawId The ID of the draw to verify
     * @returns Promise<boolean> Whether the draw results are valid
     */
    async verifyDraw(drawId: number): Promise<boolean> {
        const draw = await this.drawRepository.findOne({
            where: { id: drawId },
            relations: ['tickets', 'tickets.user'],
        });

        if (!draw) {
            throw new NotFoundException('Draw not found');
        }

        // Rerun the winner selection with the same parameters
        const drawTimestamp = Math.floor(draw.drawDate.getTime() / 1000);
        const result = await selectWinner(draw.totalTickets, drawTimestamp);

        // Verify both the block hash and winning ticket
        return (
            result.blockHash === draw.blockHash &&
            draw.tickets[result.winningTicketIndex].id === draw.winningTicketId
        );
    }
}
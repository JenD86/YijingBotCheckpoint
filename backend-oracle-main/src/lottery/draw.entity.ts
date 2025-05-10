// src/lottery/entities/draw.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity()
export class Draw {
    @PrimaryGeneratedColumn()
    id: number;

    // Change from timestamp to datetime
    @Column('datetime')
    drawDate: Date;

    @Column({ nullable: true })
    blockHash: string;

    @Column({ nullable: true })
    winningTicketId: string;

    @Column()
    totalTickets: number;

    // Change from timestamp to datetime
    @CreateDateColumn({ type: 'datetime' })
    createdAt: Date;

    @OneToMany(() => Ticket, ticket => ticket.draw)
    tickets: Ticket[];
}
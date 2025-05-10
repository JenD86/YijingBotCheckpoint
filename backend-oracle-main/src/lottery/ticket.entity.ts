import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Draw } from './draw.entity';

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true })
    user: User;

    // Change from timestamp to datetime
    @CreateDateColumn({ type: 'datetime' })
    purchaseDate: Date;

    // Change from timestamp to datetime
    @Column('datetime')
    drawDate: Date;

    @ManyToOne(() => Draw, { nullable: true })
    draw: Draw;

    @Column({ default: false })
    isWinner: boolean;
}
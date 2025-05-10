import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('users')
export class User {
  // Using telegramId as the primary key since it's unique to each user
  @PrimaryColumn()
  telegramId: number;

  @Column({ nullable: true })
  username: string;

  @Column({ default: 0 })
  points: number;
}
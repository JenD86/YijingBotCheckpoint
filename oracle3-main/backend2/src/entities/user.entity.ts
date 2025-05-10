import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column({ unique: true })
  telegramId: string = '';

  @Column({ nullable: true })
  firstName: string | undefined;

  @Column({ nullable: true })
  lastName: string | undefined;

  @Column()
  username: string = '';

  @Column()
  authDate: Date = new Date();

  @Column({ type: 'int', default: 0 })
  points: number = 0;
}


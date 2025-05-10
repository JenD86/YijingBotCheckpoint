import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryController } from './lottery.controller';
import { LotteryService } from './lottery.service';
import { Ticket } from './ticket.entity';
import { Draw } from './draw.entity';
import { User } from 'src/user/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Draw, User]),
    UserModule
  ],
  controllers: [LotteryController],
  providers: [LotteryService],
  exports: [LotteryService],
})
export class LotteryModule {}
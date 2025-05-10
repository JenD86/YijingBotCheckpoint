import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { LotteryModule } from './lottery/lottery.module';  // Add this import
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the configuration accessible throughout the app
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data.db',  // The SQLite database file
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,  // Automatically create database schema (for dev purposes)
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    LotteryModule,  // Add the LotteryModule to your imports
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
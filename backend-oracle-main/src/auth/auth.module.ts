import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';  // Import ConfigModule
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [ConfigModule],  // Add ConfigModule to the imports array
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}

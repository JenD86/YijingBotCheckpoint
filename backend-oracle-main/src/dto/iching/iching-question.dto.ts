import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class IChingQuestionDto {
  @ApiProperty({
    description: 'The question asked by the user for the I Ching reading',
    example: 'Should I pursue a new career path?'
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Unique identifier of the user requesting the reading',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
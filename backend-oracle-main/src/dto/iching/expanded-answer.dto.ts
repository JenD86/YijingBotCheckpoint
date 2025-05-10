import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ExpandedAnswerDto {
  @ApiProperty({
    description: 'Unique identifier of the user requesting the expanded reading',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Unique identifier of the hexagram reading to be expanded',
    example: 'hex_123456789'
  })
  @IsString()
  @IsNotEmpty()
  hexagramId: string;
}
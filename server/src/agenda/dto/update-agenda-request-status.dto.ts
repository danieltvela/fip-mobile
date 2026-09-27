import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateAgendaRequestStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'REJECTED'] })
  @IsEnum(['CONFIRMED', 'REJECTED'])
  status!: 'CONFIRMED' | 'REJECTED';
}

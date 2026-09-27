import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAgendaRequestDto {
  @ApiProperty({ enum: ['INTERVIEW', 'MEETING', 'SHOOTING_SLOT', 'EVENT'] })
  @IsEnum(['INTERVIEW', 'MEETING', 'SHOOTING_SLOT', 'EVENT'])
  kind!: 'INTERVIEW' | 'MEETING' | 'SHOOTING_SLOT' | 'EVENT';

  @ApiProperty({ description: 'Requested date/time (ISO 8601)' })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 120, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  durationMinutes?: number;
}

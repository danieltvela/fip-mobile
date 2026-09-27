import { ApiProperty } from '@nestjs/swagger';

export class AgendaEventDto {
  @ApiProperty({ example: 'forum-opening' })
  id!: string;

  @ApiProperty({ example: 'Opening forum: Parallel Institutions in Spain' })
  title!: string;

  @ApiProperty({ enum: ['forum', 'event'], example: 'forum' })
  category!: 'forum' | 'event';

  @ApiProperty({ example: '2026-11-10' })
  date!: string;

  @ApiProperty({ example: '10:00' })
  time!: string;

  @ApiProperty({ example: 'Auditorio Reina Sofía, Madrid' })
  venue!: string;
}

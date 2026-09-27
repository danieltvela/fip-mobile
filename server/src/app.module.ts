import { Module } from '@nestjs/common';
import { AgendaModule } from './agenda/agenda.module';
import { PrismaModule } from './prisma.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [PrismaModule, AgendaModule, MediaModule],
})
export class AppModule {}

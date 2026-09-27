import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { MediaModule } from './media/media.module';
import { AgendaModule } from './agenda/agenda.module';

@Module({
  imports: [PrismaModule, MediaModule, AgendaModule],
})
export class AppModule {}

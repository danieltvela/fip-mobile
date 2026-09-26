import { Module } from '@nestjs/common';
import { AgendaModule } from './agenda/agenda.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AgendaModule],
})
export class AppModule {}

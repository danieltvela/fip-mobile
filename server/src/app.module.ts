import { Module } from '@nestjs/common';
import { PressMaterialsModule } from './press/press-materials.module';
import { AgendaModule } from './agenda/agenda.module';
import { PrismaModule } from './prisma.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [PrismaModule, AgendaModule, MediaModule, PressMaterialsModule],
})
export class AppModule {}

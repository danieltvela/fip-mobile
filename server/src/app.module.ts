import { Module } from '@nestjs/common';
import { AgendaModule } from './agenda/agenda.module';
import { MaterialsModule } from './materials/materials.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, AgendaModule, MediaModule, MaterialsModule],
})
export class AppModule {}

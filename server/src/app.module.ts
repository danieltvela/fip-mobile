import { Module } from '@nestjs/common';
import { PressMaterialsModule } from './press/press-materials.module';
import { AgendaModule } from './agenda/agenda.module';
import { MaterialsModule } from './materials/materials.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, AgendaModule, MediaModule, MaterialsModule, PressMaterialsModule],
})
export class AppModule {}

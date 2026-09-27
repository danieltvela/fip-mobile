import { Module } from '@nestjs/common';
import { PressMaterialsModule } from './press/press-materials.module';
import { AgendaModule } from './agenda/agenda.module';
import { MaterialsModule } from './materials/materials.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, AgendaModule, MediaModule, MaterialsModule, PressMaterialsModule, NotificationsModule],
})
export class AppModule {}

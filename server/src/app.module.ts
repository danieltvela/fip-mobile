import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { JournalistsModule } from './journalists/journalists.module';
import { MaterialsModule } from './materials/materials.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AgendaRequestsModule } from './agenda-requests/agenda-requests.module';
import { ChatModule } from './chat/chat.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    JournalistsModule,
    MaterialsModule,
    NotificationsModule,
    AgendaRequestsModule,
    ChatModule,
    MediaModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [PrismaModule, MediaModule],
})
export class AppModule {}

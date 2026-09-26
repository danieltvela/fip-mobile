import { Module } from '@nestjs/common';
import { PressMaterialsModule } from './press/press-materials.module';

@Module({
  imports: [PressMaterialsModule],
})
export class AppModule {}

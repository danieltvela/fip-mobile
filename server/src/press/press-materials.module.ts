import { Module } from '@nestjs/common';
import { PressMaterialsController } from './press-materials.controller';
import { PressMaterialsService } from './press-materials.service';

@Module({
  controllers: [PressMaterialsController],
  providers: [PressMaterialsService],
})
export class PressMaterialsModule {}

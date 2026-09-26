import { Module } from '@nestjs/common';
import { MaterialsModule } from './materials/materials.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, MaterialsModule],
})
export class AppModule {}

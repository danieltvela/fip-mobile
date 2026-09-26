import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JournalistsController } from './journalists.controller';

@Module({
  imports: [AuthModule],
  controllers: [JournalistsController],
})
export class JournalistsModule {}

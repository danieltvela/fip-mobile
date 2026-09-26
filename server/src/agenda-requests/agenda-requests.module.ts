import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AgendaRequestsController } from './agenda-requests.controller';

@Module({
  imports: [AuthModule],
  controllers: [AgendaRequestsController],
})
export class AgendaRequestsModule {}

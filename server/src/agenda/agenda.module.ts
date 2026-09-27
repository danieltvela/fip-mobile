import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AgendaController } from './agenda.controller';
import { AgendaEventsController } from './agenda-events.controller';
import { AgendaService } from './agenda.service';

@Module({
  imports: [PassportModule],
  controllers: [AgendaController, AgendaEventsController],
  providers: [AgendaService, JwtStrategy],
})
export class AgendaModule {}

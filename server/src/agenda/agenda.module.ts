import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';

@Module({
  imports: [PassportModule],
  controllers: [AgendaController],
  providers: [AgendaService, JwtStrategy],
})
export class AgendaModule {}

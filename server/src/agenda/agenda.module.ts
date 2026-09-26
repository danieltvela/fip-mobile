import { Module } from '@nestjs/common';
import { AgendaController } from './agenda.controller.js';

@Module({ controllers: [AgendaController] })
export class AgendaModule {}

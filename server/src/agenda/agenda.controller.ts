import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { AgendaService } from './agenda.service';
import { CreateAgendaRequestDto } from './dto/create-agenda-request.dto';
import { UpdateAgendaRequestStatusDto } from './dto/update-agenda-request-status.dto';
import { InvalidStatusTransitionError } from './request-status';

@ApiTags('agenda')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agenda-requests')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAgendaRequestDto) {
    return this.agendaService.create(user, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.agendaService.listByJournalist(user.id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAgendaRequestStatusDto) {
    try {
      const updated = await this.agendaService.updateStatus(id, dto.status);
      if (!updated) {
        throw new NotFoundException(`Agenda request ${id} not found`);
      }
      return updated;
    } catch (error) {
      if (error instanceof InvalidStatusTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}

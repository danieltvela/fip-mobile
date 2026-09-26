import { Body, Controller, Get, NotFoundException, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsIn } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import type { UpdateAgendaRequestStatusDto } from '@fip/shared';

export const REQUEST_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'ACCEPTED'] as const;

export class UpdateStatusBody implements UpdateAgendaRequestStatusDto {
  @IsIn(REQUEST_STATUSES)
  status!: (typeof REQUEST_STATUSES)[number];
}

@ApiTags('agenda-requests')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('PRESS_TEAM')
@Controller('agenda-requests')
export class AgendaRequestsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.agendaRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const request = await this.prisma.agendaRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Agenda request not found');
    return request;
  }

  /** Changes the status of an agenda request (confirm / reject / accept / reset to pending). */
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusBody) {
    const request = await this.prisma.agendaRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Agenda request not found');
    return this.prisma.agendaRequest.update({
      where: { id },
      data: { status: body.status },
    });
  }
}

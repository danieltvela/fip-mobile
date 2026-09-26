import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { CreateAgendaRequestDto } from './dto/create-agenda-request.dto';
import { AgendaRequestStatus, assertValidTransition } from './request-status';

/**
 * Notification typologies relevant to agenda activity. A status change is an
 * "AGENDA_CHANGE"; a confirmed/rejected interview additionally carries the
 * "INTERVIEW" typology (spec: typologies include agenda change and interview).
 */
export function typologyFor(kind: string, status: AgendaRequestStatus): 'AGENDA_CHANGE' | 'INTERVIEW' {
  if (kind === 'INTERVIEW' && status !== 'PENDING') {
    return 'INTERVIEW';
  }
  return 'AGENDA_CHANGE';
}

const STATUS_TEXT: Record<Exclude<AgendaRequestStatus, 'PENDING'>, string> = {
  CONFIRMED: 'Your agenda request has been confirmed.',
  REJECTED: 'Your agenda request has been rejected.',
};

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);

  constructor(private readonly prisma: PrismaService) {}

  create(user: AuthenticatedUser, dto: CreateAgendaRequestDto) {
    return this.prisma.agendaRequest.create({
      data: {
        journalistId: user.id,
        kind: dto.kind,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        durationMinutes: dto.durationMinutes ?? 30,
      },
    });
  }

  listByJournalist(userId: string) {
    return this.prisma.agendaRequest.findMany({
      where: { journalistId: userId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async updateStatus(id: string, status: Exclude<AgendaRequestStatus, 'PENDING'>) {
    const request = await this.prisma.agendaRequest.findUnique({ where: { id } });
    if (!request) {
      return null;
    }
    assertValidTransition(request.status, status);

    const updated = await this.prisma.agendaRequest.update({
      where: { id },
      data: { status },
    });

    await this.notifyJournalist(updated.journalistId, updated.kind, status, updated.id);
    return updated;
  }

  private async notifyJournalist(
    userId: string,
    kind: string,
    status: Exclude<AgendaRequestStatus, 'PENDING'>,
    requestId: string,
  ): Promise<void> {
    const title = `Agenda request ${status.toLowerCase()}`;
    await this.prisma.notification.create({
      data: {
        userId,
        typology: typologyFor(kind, status),
        title,
        body: STATUS_TEXT[status],
        data: { requestId, kind, status },
      },
    });
    this.logger.log(`Notification created for journalist ${userId} (${requestId} -> ${status})`);
  }
}

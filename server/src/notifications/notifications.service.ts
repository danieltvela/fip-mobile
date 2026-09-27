import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationDto, NotificationPage, NotificationTypology as NotificationTypologyDto } from '@fip/shared';
import { NotificationTypology, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Shared DTO typologies (lowercase) map 1:1 onto the Prisma enum. */
const PRISMA_TYPOLOGY: Record<NotificationTypologyDto, NotificationTypology> = {
  press_note: NotificationTypology.PRESS_NOTE,
  agenda_change: NotificationTypology.AGENDA_CHANGE,
  interview: NotificationTypology.INTERVIEW,
  private_communication: NotificationTypology.PRIVATE_COMMUNICATION,
  incident: NotificationTypology.INCIDENT,
};

/**
 * Per-user notification center. Notifications are scoped to the requesting
 * user; until the full auth backbone lands in the app, unauthenticated
 * requests resolve to the seeded demo journalist so the screen stays usable.
 */
export const DEMO_USER_EMAIL = 'journalist@fip.example';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Authenticated requests use the JWT subject; anonymous requests fall back
   * to the seeded demo journalist until the app ships a login flow.
   */
  async resolveUserId(authenticatedId?: string): Promise<string> {
    if (authenticatedId) {
      return authenticatedId;
    }
    const demo = await this.prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
    if (!demo) {
      throw new NotFoundException(
        `Demo user ${DEMO_USER_EMAIL} not found. Run the database seed (pnpm --filter @fip/server run db:seed).`,
      );
    }
    return demo.id;
  }

  /**
   * Chronological (newest first) paginated listing with the current unread
   * count, so the mobile badge stays consistent with every page fetched.
   */
  async list(userId: string, query: { page?: number; pageSize?: number }): Promise<NotificationPage> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));

    const [total, unreadCount, rows] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((row) => this.toDto(row)),
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
      unreadCount,
    };
  }

  /** Marks one notification as read and returns it with the new unread count. */
  async markAsRead(userId: string, id: string): Promise<NotificationDto & { unreadCount: number }> {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    const row = existing.readAt
      ? existing
      : await this.prisma.notification.update({
          where: { id },
          data: { readAt: new Date() },
        });
    const unreadCount = await this.prisma.notification.count({ where: { userId, readAt: null } });

    return { ...this.toDto(row), unreadCount };
  }

  /**
   * Creates a notification. Used by the seed and, later, by the flows that
   * emit notifications (press notes, agenda changes, requests, incidents).
   */
  create(data: {
    userId: string;
    typology: NotificationTypologyDto;
    title: string;
    body: string;
    data?: Prisma.InputJsonValue;
  }) {
    return this.prisma.notification.create({ data: { ...data, typology: PRISMA_TYPOLOGY[data.typology] } });
  }

  private toDto(row: {
    id: string;
    typology: NotificationTypology;
    title: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
  }): NotificationDto {
    return {
      id: row.id,
      typology: row.typology.toLowerCase() as NotificationTypologyDto,
      title: row.title,
      body: row.body,
      receivedAt: row.createdAt.toISOString(),
      readAt: row.readAt ? row.readAt.toISOString() : null,
    };
  }
}

import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { ChatMessageDto, ChatNotificationEvent, ChatMessageEvent } from '@fip/shared';
import { ChatDirectory } from './chat.directory';

export const CHAT_MESSAGE_EVENT = 'chat:message';
export const CHAT_NOTIFICATION_EVENT = 'chat:notification';
const PRESS_ROOM = 'press';

/** Socket.io room holding the 1:1 conversation of one journalist. */
export function journalistRoom(journalistId: string): string {
  return `journalist:${journalistId}`;
}

export interface ChatSocketUser {
  id: string;
  email: string;
  name: string;
  role: 'PRESS' | 'JOURNALIST';
}

/**
 * Real-time transport for the contact channel. Clients authenticate on the
 * handshake with a bearer JWT (same payload as the HTTP JwtStrategy).
 * Journalists join their own conversation room; press team members join the
 * shared `press` room so every journalist conversation reaches the team.
 */
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly directory: ChatDirectory,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const header = client.handshake.headers.authorization;
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : undefined);
    try {
      const payload = this.jwtService.verify<{ sub: string; email?: string; name?: string; role?: string }>(token ?? '');
      if (!payload?.sub) {
        throw new Error('missing subject');
      }
      client.data.user = {
        id: payload.sub,
        email: payload.email ?? '',
        name: payload.name ?? '',
        role: payload.role === 'PRESS' ? 'PRESS' : 'JOURNALIST',
      } satisfies ChatSocketUser;
      const user = client.data.user as ChatSocketUser;
      // Conversation rooms are keyed by the Journalist-row id, which may
      // differ from the JWT subject (a User id); bridge through the directory.
      const journalistRoomId =
        user.role === 'PRESS'
          ? PRESS_ROOM
          : journalistRoom(await this.directory.journalistIdForUser(user));
      await client.join(journalistRoomId);
    } catch (error) {
      this.logger.warn(
        `Rejected chat connection ${client.id}: ${error instanceof Error ? error.message : 'unauthenticated'}`,
      );
      client.disconnect(true);
    }
  }

  /** Broadcasts a new message to the journalist conversation and the press team. */
  emitMessage(message: ChatMessageDto): void {
    const payload: ChatMessageEvent = { event: CHAT_MESSAGE_EVENT, message };
    this.server.to(journalistRoom(message.journalistId)).to(PRESS_ROOM).emit(CHAT_MESSAGE_EVENT, payload);
  }

  /** Real-time in-app notification delivered to the journalist conversation room. */
  emitNotification(journalistId: string, notification: Omit<ChatNotificationEvent, 'event'>): void {
    this.server.to(journalistRoom(journalistId)).emit(CHAT_NOTIFICATION_EVENT, {
      event: CHAT_NOTIFICATION_EVENT,
      ...notification,
    });
  }
}

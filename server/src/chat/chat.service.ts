import { BadRequestException, Injectable } from '@nestjs/common';
import type { ChatMessageDto } from '@fip/shared';
import { PrismaService } from '../prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { ChatGateway } from './chat.gateway';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
  ) {}

  /**
   * Persisted history of the 1:1 conversation. Journalists read their own
   * thread; press team members must target one journalist conversation.
   */
  async list(user: AuthenticatedUser, journalistId?: string): Promise<ChatMessageDto[]> {
    const targetId = user.role === 'PRESS' ? journalistId : user.id;
    if (user.role === 'PRESS' && !journalistId) {
      throw new BadRequestException('journalistId is required to read a conversation');
    }
    const messages = await this.prisma.contactMessage.findMany({
      where: { journalistId: targetId },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map(toDto);
  }

  /**
   * Journalists post to their own conversation; press team members reply into
   * a target conversation and trigger an in-app notification for the journalist.
   */
  async send(user: AuthenticatedUser, dto: SendChatMessageDto): Promise<ChatMessageDto> {
    const isPress = user.role === 'PRESS';
    const journalistId = isPress ? dto.journalistId : user.id;
    if (!journalistId) {
      throw new BadRequestException('journalistId is required to reply as the press team');
    }

    const created = await this.prisma.contactMessage.create({
      data: {
        journalistId,
        body: dto.body,
        authorStaffName: isPress ? user.name : null,
      },
    });

    const message = toDto(created);
    this.gateway.emitMessage(message);

    if (isPress) {
      await this.prisma.notification.create({
        data: {
          userId: journalistId,
          typology: 'PRIVATE_COMMUNICATION',
          title: 'New message from the press team',
          body: created.body.slice(0, 140),
          data: { messageId: created.id },
        },
      });
      this.gateway.emitNotification(journalistId, {
        title: 'New message from the press team',
        body: created.body.slice(0, 140),
        messageId: created.id,
      });
    }

    return message;
  }
}

function toDto(message: {
  id: string;
  journalistId: string;
  body: string;
  authorStaffName: string | null;
  createdAt: Date;
}): ChatMessageDto {
  return {
    id: message.id,
    journalistId: message.journalistId,
    body: message.body,
    authorStaffName: message.authorStaffName,
    authorRole: message.authorStaffName === null ? 'JOURNALIST' : 'PRESS',
    createdAt: message.createdAt.toISOString(),
  };
}

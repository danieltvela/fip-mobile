import { BadRequestException, Injectable } from '@nestjs/common';
import type { ChatMessageDto } from '@fip/shared';
import { PrismaService } from '../prisma.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { ChatGateway } from './chat.gateway';
import { ChatDirectory } from './chat.directory';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: ChatGateway,
    private readonly directory: ChatDirectory,
  ) {}

  /**
   * Persisted history of the 1:1 conversation. Journalists read their own
   * thread; press team members must target one journalist conversation.
   * Journalist ids here are Journalist-row ids, resolved from the User id
   * carried by the JWT.
   */
  async list(user: AuthenticatedUser, journalistId?: string): Promise<ChatMessageDto[]> {
    const targetId = user.role === 'PRESS' ? journalistId : await this.directory.journalistIdForUser(user);
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
    if (user.role === 'PRESS') {
      return this.sendPressReply(user, dto);
    }
    // ContactMessage rows are owned by a Journalist; the JWT subject is a User
    // id. The two are bridged through the shared email by the directory.
    const journalistId = await this.directory.journalistIdForUser(user);
    const created = await this.prisma.contactMessage.create({
      data: { journalistId, body: dto.body, authorStaffName: null },
    });
    const message = toDto(created);
    this.gateway.emitMessage(message);
    return message;
  }

  private async sendPressReply(
    user: AuthenticatedUser,
    dto: SendChatMessageDto,
  ): Promise<ChatMessageDto> {
    if (!dto.journalistId) {
      throw new BadRequestException('journalistId is required to reply as the press team');
    }
    // Notifications reference User rows; the reply targets a Journalist row.
    const journalistUserId = await this.directory.userIdForJournalist(dto.journalistId);

    const created = await this.prisma.contactMessage.create({
      data: {
        journalistId: dto.journalistId,
        body: dto.body,
        authorStaffName: user.name,
      },
    });

    const message = toDto(created);
    this.gateway.emitMessage(message);

    const excerpt = created.body.slice(0, 140);
    await this.prisma.notification.create({
      data: {
        userId: journalistUserId,
        typology: 'PRIVATE_COMMUNICATION',
        title: 'New message from the press team',
        body: excerpt,
        data: { messageId: created.id },
      },
    });
    this.gateway.emitNotification(created.journalistId, {
      title: 'New message from the press team',
      body: excerpt,
      messageId: created.id,
    });

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

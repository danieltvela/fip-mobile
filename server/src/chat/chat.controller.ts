import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { Roles, RolesGuard } from '../common/roles.guard';
import type { ReplyChatDto } from '@fip/shared';

export class ReplyBody implements ReplyChatDto {
  @IsString()
  @MinLength(1)
  body!: string;
}

export class CreateConversationBody {
  @IsString()
  @MinLength(1)
  userId!: string;

  @IsString()
  @MinLength(1)
  subject!: string;
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('PRESS_TEAM')
@Controller('chat')
export class ChatController {
  constructor(private prisma: PrismaService) {}

  @Get('conversations')
  listConversations() {
    return this.prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  /** Sends a press-team reply in a chat conversation. */
  @Post('conversations/:id/reply')
  async reply(@Param('id') id: string, @Body() reply: ReplyBody) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return this.prisma.message.create({
      data: {
        conversationId: id,
        authorRole: 'press_team',
        body: reply.body,
      },
    });
  }
}

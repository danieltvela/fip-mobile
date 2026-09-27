import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { ChatService } from './chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  list(@CurrentUser() user: AuthenticatedUser, @Query('journalistId') journalistId?: string) {
    return this.chatService.list(user, journalistId);
  }

  @Post('messages')
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendChatMessageDto) {
    return this.chatService.send(user, dto);
  }
}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatDirectory } from './chat.directory';

@Module({
  imports: [
    // The gateway verifies handshake tokens with the same secret the HTTP
    // JwtStrategy requires; startup fails fast when JWT_SECRET is absent.
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatDirectory],
  exports: [ChatGateway],
})
export class ChatModule {}

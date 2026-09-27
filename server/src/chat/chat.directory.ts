import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/**
 * Bridges the authentication principal (User rows, whose id is the JWT `sub`)
 * and the chat domain (Journalist rows, which own ContactMessage).
 *
 * The two tables are linked by the shared unique email. A journalist User
 * without a Journalist row yet gets one created on first contact so the
 * conversation history is keyed by a stable Journalist id, never the User id
 * (ContactMessage.journalistId references Journalist, not User).
 */
@Injectable()
export class ChatDirectory {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolves (creating if needed) the Journalist row for an authenticated user. */
  async journalistIdForUser(user: { id: string; email: string; name: string }): Promise<string> {
    if (!user.email) {
      throw new BadRequestException('Authenticated token is missing an email to resolve the journalist profile');
    }
    const journalist = await this.prisma.journalist.upsert({
      where: { email: user.email },
      update: {},
      create: { email: user.email, fullName: user.name || user.email },
    });
    return journalist.id;
  }

  /** Resolves (creating if needed) the User account behind a Journalist conversation. */
  async userIdForJournalist(journalistId: string): Promise<string> {
    const journalist = await this.prisma.journalist.findUnique({ where: { id: journalistId } });
    if (!journalist) {
      throw new BadRequestException('Journalist conversation not found');
    }
    const user = await this.prisma.user.upsert({
      where: { email: journalist.email },
      update: {},
      create: { email: journalist.email, name: journalist.fullName, role: 'JOURNALIST' },
    });
    return user.id;
  }
}

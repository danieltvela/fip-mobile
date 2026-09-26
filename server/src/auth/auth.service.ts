import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from '../common/password';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken);
      if (payload.type !== 'refresh') throw new Error('wrong token type');
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error('unknown user');
      return this.issueTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateAccessToken(payload: JwtPayload) {
    if (payload.type !== 'access') throw new UnauthorizedException('Wrong token type');
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('Unknown user');
    return user;
  }

  private issueTokens(sub: string, email: string, role: string) {
    const payload: Omit<JwtPayload, 'type'> = { sub, email, role };
    return {
      accessToken: this.jwt.sign({ ...payload, type: 'access' }, { expiresIn: ACCESS_TTL }),
      refreshToken: this.jwt.sign({ ...payload, type: 'refresh' }, { expiresIn: REFRESH_TTL }),
    };
  }
}

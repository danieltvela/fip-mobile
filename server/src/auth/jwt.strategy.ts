import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type UserRole = 'PRESS' | 'JOURNALIST';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  role?: string;
}

/**
 * Minimal JWT authentication for issue #12. The auth backbone owns the full
 * token issuing flow; this strategy only validates existing access tokens so
 * endpoints can resolve the requesting user and their role.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireSecret(),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      id: payload.sub,
      email: payload.email ?? '',
      name: payload.name ?? '',
      role: payload.role === 'PRESS' ? 'PRESS' : 'JOURNALIST',
    };
  }
}

function requireSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail startup rather than silently authenticating with a hardcoded secret.
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

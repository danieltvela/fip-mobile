import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
}

/**
 * Minimal JWT authentication for issue #12. The auth backbone owns the full
 * token issuing flow; this strategy only validates existing access tokens so
 * endpoints can resolve the requesting journalist.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { id: payload.sub, email: payload.email ?? '', name: payload.name ?? '' };
  }
}

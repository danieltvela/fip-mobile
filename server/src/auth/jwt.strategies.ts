import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
  sub: string;
  tokenType: 'access' | 'refresh';
};

export const REFRESH_TOKEN_HEADER = 'x-refresh-token';

export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set to at least 16 characters');
  }
  return secret;
}

/** Access-token strategy used by the JwtAuthGuard for protected endpoints. */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (payload.tokenType !== 'access') throw new Error('Invalid token type');
    return payload;
  }
}

/**
 * Refresh-token strategy: refresh tokens never travel in the standard
 * Authorization header; POST /auth/refresh reads the dedicated header.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromHeader(REFRESH_TOKEN_HEADER),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (payload.tokenType !== 'refresh') throw new Error('Invalid token type');
    return payload;
  }
}

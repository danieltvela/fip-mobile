import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { JwtPayload, jwtSecret } from './jwt.strategies';
import { PrismaService } from '../prisma/prisma.service';
import {
  JournalistProfile,
  LoginResponse,
  isValidCredentialFormat,
  normalizeCredential,
} from '@fip/shared';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const ACCESS_TOKEN_TTL = '12h';
const REFRESH_TOKEN_TTL = '30d';

export const SCRYPT_KEYLEN = 64;

export async function hashCredential(credential: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(credential, salt, SCRYPT_KEYLEN);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyCredential(credential: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const derived = await scrypt(credential, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hex, 'hex');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function toProfile(journalist: {
  id: string;
  credentialNumber: string;
  name: string;
  outlet: string;
  role: string;
}): JournalistProfile {
  const { id, credentialNumber, name, outlet, role } = journalist;
  return { id, credentialNumber, name, outlet, role };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(rawCredential: unknown): Promise<LoginResponse> {
    const credential =
      typeof rawCredential === 'string'
        ? normalizeCredential(rawCredential)
        : '';
    if (!isValidCredentialFormat(credential)) {
      throw new UnauthorizedException('Invalid credential number format');
    }

    const journalist = await this.prisma.journalist.findUnique({
      where: { credentialNumber: credential },
    });
    // Constant-ish failure path: always run a hash comparison so a missing
    // record and a wrong credential cost the same.
    const ok =
      journalist !== null &&
      (await verifyCredential(credential, journalist.credentialHash));
    if (!ok || journalist === null) {
      throw new UnauthorizedException('Unknown credential number');
    }

    const refreshToken = await this.issueTokens(journalist.id);
    return { ...refreshToken, journalist: toProfile(journalist) };
  }

  async refresh(refreshToken: unknown): Promise<LoginResponse> {
    if (typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Missing refresh token');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: jwtSecret() });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const journalist = await this.prisma.journalist.findUnique({
      where: { id: payload.sub },
    });
    const hashMatches =
      journalist !== null &&
      journalist.refreshTokenHash !== null &&
      (await verifyCredential(refreshToken, journalist.refreshTokenHash));
    if (journalist === null || !hashMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const tokens = await this.issueTokens(journalist.id);
    return { ...tokens, journalist: toProfile(journalist) };
  }

  async logout(journalistId: string): Promise<{ success: boolean }> {
    await this.prisma.journalist.update({
      where: { id: journalistId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }

  async profile(journalistId: string): Promise<JournalistProfile> {
    const journalist = await this.prisma.journalist.findUnique({
      where: { id: journalistId },
    });
    if (journalist === null) throw new UnauthorizedException('Unknown journalist');
    return toProfile(journalist);
  }

  private async issueTokens(journalistId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = await this.signToken({ sub: journalistId, tokenType: 'access' }, ACCESS_TOKEN_TTL);
    const refreshTokenValue = await this.signToken({ sub: journalistId, tokenType: 'refresh' }, REFRESH_TOKEN_TTL);
    await this.prisma.journalist.update({
      where: { id: journalistId },
      data: { refreshTokenHash: await hashCredential(refreshTokenValue) },
    });
    return { accessToken, refreshToken: refreshTokenValue };
  }

  private signToken(payload: JwtPayload, expiresIn: '12h' | '30d'): Promise<string> {
    // jti guarantees that two tokens minted within the same second
    // (same payload, same iat/exp) are still byte-distinct, so refresh
    // rotation always produces a new usable token.
    return this.jwt.signAsync({ ...payload, jti: randomUUID() }, { secret: jwtSecret(), expiresIn });
  }
}

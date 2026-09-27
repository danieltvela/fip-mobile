import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService, hashCredential } from './auth.service';
import { PrismaService } from '../prisma.service';
import { LoginResponse } from '@fip/shared';

const VALID_CREDENTIAL = '4000123456789017';

async function makeJournalistRecord() {
  return {
  id: 'jrn-1',
  credentialNumber: VALID_CREDENTIAL,
  credentialHash: await hashCredential(VALID_CREDENTIAL),
  name: 'Ana Rueda',
  outlet: 'El Faro Digital',
  role: 'Staff reporter',
  refreshTokenHash: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  };
}


type PrismaMock = { journalist: { findUnique: jest.Mock; update: jest.Mock } };

async function setup(prismaOverrides?: Partial<PrismaMock>): Promise<{
  authService: AuthService;
  jwtService: JwtService;
  prisma: PrismaMock;
}> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: { journalist: prismaOverrides?.journalist ?? {
        findUnique: jest.fn(async ({ where }: { where: { credentialNumber?: string; id?: string } }) =>
          where.credentialNumber === VALID_CREDENTIAL || where.id === 'jrn-1'
            ? await makeJournalistRecord()
            : null,
        ),
        update: jest.fn().mockResolvedValue({}),
      } } },
      { provide: JwtService, useValue: { signAsync: jest.fn(async (payload) => `${payload.tokenType}-signed`), verifyAsync: jest.fn() } },
    ],
  }).compile();

  const authService = moduleRef.get(AuthService);
  return {
    authService,
    jwtService: moduleRef.get(JwtService),
    prisma: moduleRef.get(PrismaService) as unknown as PrismaMock,
  };
}

describe('AuthService.login', () => {
  it('returns tokens and the profile for a Luhn-valid known credential', async () => {
    const { authService, prisma } = await setup();
    prisma.journalist.findUnique.mockImplementation(async ({ where }) =>
      where.credentialNumber === VALID_CREDENTIAL
        ? { ...(await makeJournalistRecord()) }
        : null,
    );

    const response: LoginResponse = await authService.login('4000 1234 5678 9017');

    expect(response.journalist).toMatchObject({
      name: 'Ana Rueda',
      outlet: 'El Faro Digital',
      role: 'Staff reporter',
      credentialNumber: VALID_CREDENTIAL,
    });
    expect(response.accessToken).toBe('access-signed');
    expect(response.refreshToken).toBe('refresh-signed');
    expect(prisma.journalist.update).toHaveBeenCalledWith({
      where: { id: 'jrn-1' },
      data: { refreshTokenHash: expect.stringContaining(':') },
    });
  });

  it('normalizes separators before validation', async () => {
    const { authService, prisma } = await setup();
    await expect(authService.login('4000-1234-5678-9017')).resolves.toMatchObject({
      journalist: { credentialNumber: VALID_CREDENTIAL },
    });
    expect(prisma.journalist.findUnique).toHaveBeenCalledWith({ where: { credentialNumber: VALID_CREDENTIAL } });
  });

  it('rejects a structurally invalid credential without a database lookup', async () => {
    const { authService, prisma } = await setup();
    await expect(authService.login('4000123456789018')).rejects.toThrow('Invalid credential number format');
    expect(prisma.journalist.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an unknown credential', async () => {
    const { authService } = await setup();
    await expect(authService.login('5512123456789007')).rejects.toThrow('Unknown credential number');
  });

  it('rejects a known credential number with a wrong value', async () => {
    const { authService, prisma } = await setup();
    prisma.journalist.findUnique.mockResolvedValue({
      ...(await makeJournalistRecord()),
      credentialHash: await hashCredential('5512123456789007'),
    });
    await expect(authService.login(VALID_CREDENTIAL)).rejects.toThrow('Unknown credential number');
  });
});

describe('AuthService.refresh', () => {
  it('rejects a non-string refresh token', async () => {
    const { authService } = await setup();
    await expect(authService.refresh(undefined)).rejects.toThrow('Missing refresh token');
  });

  it('rotates the refresh token for a matching stored hash', async () => {
    const { authService, jwtService, prisma } = await setup();
    const oldRefreshToken = 'old-refresh-token';
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'jrn-1', tokenType: 'refresh' });
    prisma.journalist.findUnique.mockResolvedValue({
      ...(await makeJournalistRecord()),
      refreshTokenHash: await hashCredential(oldRefreshToken),
    });

    const response = await authService.refresh(oldRefreshToken);

    expect(response.accessToken).toBe('access-signed');
    expect(prisma.journalist.update).toHaveBeenCalledWith({
      where: { id: 'jrn-1' },
      data: { refreshTokenHash: expect.stringContaining(':') },
    });
  });

  it('rejects a refresh token whose hash no longer matches (already rotated or logged out)', async () => {
    const { authService, jwtService, prisma } = await setup();
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'jrn-1', tokenType: 'refresh' });
    prisma.journalist.findUnique.mockResolvedValue({
      ...(await makeJournalistRecord()),
      refreshTokenHash: null,
    });

    await expect(authService.refresh('some-token')).rejects.toThrow('Invalid refresh token');
  });

  it('rejects a refresh-token payload signed as an access token', async () => {
    const { authService, jwtService } = await setup();
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'jrn-1', tokenType: 'access' });
    await expect(authService.refresh('some-token')).rejects.toThrow('Invalid refresh token');
  });
});

describe('AuthService.logout and profile', () => {
  it('clears the stored refresh-token hash on logout', async () => {
    const { authService, prisma } = await setup();
    await expect(authService.logout('jrn-1')).resolves.toEqual({ success: true });
    expect(prisma.journalist.update).toHaveBeenCalledWith({
      where: { id: 'jrn-1' },
      data: { refreshTokenHash: null },
    });
  });

  it('returns name, outlet and role in the profile', async () => {
    const { authService } = await setup();
    await expect(authService.profile('jrn-1')).resolves.toEqual({
      id: 'jrn-1',
      credentialNumber: VALID_CREDENTIAL,
      name: 'Ana Rueda',
      outlet: 'El Faro Digital',
      role: 'Staff reporter',
    });
  });
});

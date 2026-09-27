import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it('throws at construction when JWT_SECRET is missing (fail-fast startup)', () => {
    delete process.env.JWT_SECRET;
    expect(() => new JwtStrategy()).toThrow('JWT_SECRET environment variable is required');
  });

  it('validates tokens and defaults missing role to JOURNALIST', () => {
    process.env.JWT_SECRET = 'test-secret';
    const strategy = new JwtStrategy();
    expect(strategy.validate({ sub: 'u1', email: 'j@example.com', name: 'Jour' })).toEqual({
      id: 'u1',
      email: 'j@example.com',
      name: 'Jour',
      role: 'JOURNALIST',
    });
  });

  it('accepts PRESS role from the token payload', () => {
    process.env.JWT_SECRET = 'test-secret';
    const strategy = new JwtStrategy();
    expect(strategy.validate({ sub: 'p1', role: 'PRESS' }).role).toBe('PRESS');
  });
});

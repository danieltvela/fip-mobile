import { ApiError, apiLogin, apiLogout, apiMe } from './api';

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response;
}

describe('apiLogin', () => {
  it('rejects an invalid credential format before any network request', async () => {
    await expect(apiLogin('4000123456789018')).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the credential number and returns tokens plus profile', async () => {
    const payload = { accessToken: 'a', refreshToken: 'r', journalist: { id: 'j', credentialNumber: '4000123456789017', name: 'Ana', outlet: 'El Faro', role: 'Reporter' } };
    fetchMock.mockResolvedValue(jsonResponse(payload));

    await expect(apiLogin('4000 1234 5678 9017')).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ credentialNumber: '4000 1234 5678 9017' }) }),
    );
  });

  it('surfaces 401 as ApiError for unrecognized credentials', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Unknown credential number' }, 401));
    await expect(apiLogin('4000123456789017')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('authenticated requests', () => {
  it('sends the bearer token on /auth/me', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ name: 'Ana' }));
    await apiMe('token-123');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-123' }) }),
    );
  });

  it('posts logout with the access token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }));
    await apiLogout('token-123');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

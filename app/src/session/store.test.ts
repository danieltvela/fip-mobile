import * as SecureStore from 'expo-secure-store';
import { clearSession, loadSession, saveSession, sessionFromLogin, StoredSession } from './store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secureStore = jest.mocked(SecureStore);

const session: StoredSession = {
  accessToken: 'a',
  refreshToken: 'r',
  journalist: { id: 'j', credentialNumber: '4000123456789017', name: 'Ana', outlet: 'El Faro', role: 'Reporter' },
};

describe('session persistence', () => {
  beforeEach(() => secureStore.setItemAsync.mockReset());

  it('maps a login response to a stored session', () => {
    expect(sessionFromLogin({ ...session, extra: true } as never)).toEqual(session);
  });

  it('persists the session in secure storage and restores it', async () => {
    await saveSession(session);
    expect(secureStore.setItemAsync).toHaveBeenCalledWith('fip.session.v1', JSON.stringify(session));

    secureStore.getItemAsync.mockResolvedValue(JSON.stringify(session));
    await expect(loadSession()).resolves.toEqual(session);
  });

  it('returns null when nothing is persisted', async () => {
    secureStore.getItemAsync.mockResolvedValue(null);
    await expect(loadSession()).resolves.toBeNull();
  });

  it('discards corrupted payloads instead of crashing', async () => {
    secureStore.getItemAsync.mockResolvedValue('{not-json');
    await expect(loadSession()).resolves.toBeNull();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('fip.session.v1');
  });

  it('drops the persisted payload on logout', async () => {
    await clearSession();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('fip.session.v1');
  });
});

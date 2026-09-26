import * as SecureStore from 'expo-secure-store';
import { JournalistProfile, LoginResponse } from '@fip/shared';

const SESSION_KEY = 'fip.session.v1';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  journalist: JournalistProfile;
};

export function sessionFromLogin(login: LoginResponse): StoredSession {
  return {
    accessToken: login.accessToken,
    refreshToken: login.refreshToken,
    journalist: login.journalist,
  };
}

/**
 * The session must survive app restarts: tokens and the journalist profile
 * are persisted in the device secure storage (encrypted on iOS Keychain /
 * Android Keystore).
 */
export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.journalist) return null;
    return parsed;
  } catch {
    await clearSession();
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

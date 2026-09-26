import { JournalistProfile, LoginResponse } from '@fip/shared';
import { CREDENTIAL_LENGTH, formatCredential, isValidCredentialFormat } from '@fip/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, options: RequestInit & { token?: string }): Promise<Response> {
  const headers: Record<string, string> = options.headers as Record<string, string> ?? {};
  if (options.body) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new ApiError(response.status, message);
  }
  return response;
}

export async function apiLogin(credentialNumber: string): Promise<LoginResponse> {
  if (!isValidCredentialFormat(credentialNumber)) {
    throw new ApiError(400, 'Credential number must be a valid 16-digit VISA or MasterCard number');
  }
  const response = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ credentialNumber }),
  });
  return (await response.json()) as LoginResponse;
}

export async function apiRefresh(refreshToken: string): Promise<LoginResponse> {
  const response = await request('/auth/refresh', {
    method: 'POST',
    headers: { 'x-refresh-token': refreshToken },
  });
  return (await response.json()) as LoginResponse;
}

export async function apiMe(accessToken: string): Promise<JournalistProfile> {
  const response = await request('/auth/me', { token: accessToken });
  return (await response.json()) as JournalistProfile;
}

export async function apiLogout(accessToken: string): Promise<void> {
  await request('/auth/logout', { method: 'POST', token: accessToken });
}

export { API_BASE_URL, CREDENTIAL_LENGTH, formatCredential, isValidCredentialFormat };

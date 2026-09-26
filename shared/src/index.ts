// Domain types shared by server, app and admin (issues #3, #4, ...).
export * from './credentials.js';

export type JournalistProfile = {
  id: string;
  credentialNumber: string;
  name: string;
  outlet: string;
  role: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  journalist: JournalistProfile;
};

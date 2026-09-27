/** Cross-package API contracts for the FIP press platform. */

export type { MediaItemDto, GalleryRefDto } from './media.js';

export enum UserRole {
  PRESS_TEAM = 'PRESS_TEAM',
  JOURNALIST = 'JOURNALIST',
}

export type MaterialTypeValue = 'PRESS_RELEASE' | 'NOTE' | 'PHOTOGRAPH' | 'VIDEO' | 'AUDIO';
export type NotificationTypologyValue = 'BREAKING_NEWS' | 'EVENT_REMINDER' | 'NEW_MATERIAL' | 'GENERAL';
export type AudienceSegmentValue = 'ALL' | 'JOURNALISTS' | 'CONFIRMED_AGENDA';
export type AgendaRequestStatusValue = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'ACCEPTED';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface CreateJournalistDto {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface CreatePressMaterialDto {
  title: string;
  type: MaterialTypeValue;
  topic: string;
  body: string;
  mediaUrl?: string;
  published?: boolean;
}

export type UpdatePressMaterialDto = Partial<CreatePressMaterialDto>;

export interface PublishNotificationDto {
  title: string;
  body: string;
  typology: NotificationTypologyValue;
  segment: AudienceSegmentValue;
  userId?: string;
}

export interface UpdateAgendaRequestStatusDto {
  status: AgendaRequestStatusValue;
}

export interface ReplyChatDto {
  body: string;
}

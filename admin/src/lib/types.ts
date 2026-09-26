import type {
  AgendaRequestStatusValue,
  AudienceSegmentValue,
  NotificationTypologyValue,
} from '@fip/shared';

export type { AgendaRequestStatusValue, AudienceSegmentValue, NotificationTypologyValue };

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'PRESS_TEAM' | 'JOURNALIST';
  createdAt: string;
}

export interface PressMaterialRecord {
  id: string;
  title: string;
  type: 'PRESS_RELEASE' | 'NOTE' | 'PHOTOGRAPH' | 'VIDEO' | 'AUDIO';
  topic: string;
  body: string;
  mediaUrl?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  typology: NotificationTypologyValue;
  segment: AudienceSegmentValue;
  userId?: string | null;
  createdAt: string;
}

export interface AgendaRequestRecord {
  id: string;
  journalistId: string;
  eventId: string;
  eventTitle: string;
  note: string;
  status: AgendaRequestStatusValue;
  createdAt: string;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  authorId?: string | null;
  authorRole: string;
  body: string;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  subject: string;
  createdAt: string;
  messages: MessageRecord[];
}

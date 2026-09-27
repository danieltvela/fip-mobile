// Real-time contact channel with the press office (issue #15).

/** A chat message in the 1:1 conversation between a journalist and the press team. */
export interface ChatMessageDto {
  id: string;
  journalistId: string;
  body: string;
  /** Press team display name when sent by the team; null when sent by the journalist. */
  authorStaffName: string | null;
  /** Who sent the message: the journalist or a press team member. */
  authorRole: 'JOURNALIST' | 'PRESS';
  createdAt: string;
}

/** Payload of the `chat:message` event broadcast to both participants. */
export interface ChatMessageEvent {
  event: 'chat:message';
  message: ChatMessageDto;
}

/** Socket event emitted to the journalist when the press team replies. */
export interface ChatNotificationEvent {
  event: 'notification';
  title: string;
  body: string;
  messageId: string;
}

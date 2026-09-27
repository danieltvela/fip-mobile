export type AgendaRequestKind = 'INTERVIEW' | 'MEETING' | 'SHOOTING_SLOT' | 'EVENT';
export type AgendaRequestStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

/**
 * Allowed lifecycle transitions for an agenda request. Anything not listed is
 * rejected with `InvalidStatusTransitionError`.
 *
 * pending -> confirmed | rejected
 * confirmed, rejected -> terminal
 */
export const STATUS_TRANSITIONS: Record<AgendaRequestStatus, AgendaRequestStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: [],
  REJECTED: [],
};

export class InvalidStatusTransitionError extends Error {
  constructor(from: AgendaRequestStatus, to: AgendaRequestStatus) {
    super(`Cannot transition agenda request from ${from} to ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}

export function assertValidTransition(
  from: AgendaRequestStatus,
  to: AgendaRequestStatus,
): void {
  if (!STATUS_TRANSITIONS[from]?.includes(to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}

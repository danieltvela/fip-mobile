import { InvalidStatusTransitionError, assertValidTransition, STATUS_TRANSITIONS } from './request-status';

describe('agenda request status transitions', () => {
  it('allows pending -> confirmed and pending -> rejected', () => {
    expect(() => assertValidTransition('PENDING', 'CONFIRMED')).not.toThrow();
    expect(() => assertValidTransition('PENDING', 'REJECTED')).not.toThrow();
  });

  it('treats confirmed and rejected as terminal states', () => {
    expect(STATUS_TRANSITIONS.CONFIRMED).toEqual([]);
    expect(STATUS_TRANSITIONS.REJECTED).toEqual([]);
    expect(() => assertValidTransition('CONFIRMED', 'REJECTED')).toThrow(InvalidStatusTransitionError);
    expect(() => assertValidTransition('CONFIRMED', 'PENDING')).toThrow(InvalidStatusTransitionError);
    expect(() => assertValidTransition('REJECTED', 'CONFIRMED')).toThrow(InvalidStatusTransitionError);
  });

  it('does not allow no-op transitions', () => {
    expect(() => assertValidTransition('PENDING', 'PENDING')).toThrow(InvalidStatusTransitionError);
  });

  it('surfaces a descriptive error', () => {
    expect(() => assertValidTransition('REJECTED', 'PENDING')).toThrow(
      'Cannot transition agenda request from REJECTED to PENDING',
    );
  });
});

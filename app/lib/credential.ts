/**
 * Credential data for issue #14.
 *
 * The real credential comes from the profile/auth layer (#4) once on-site
 * accreditation completes. Until that wiring lands, `useCredential` returns
 * a deactivated placeholder so the screen stays behind the activation gate.
 */

export interface Credential {
  /** Locator code, e.g. XFJH2356EH. Doubles as the QR payload. */
  locatorCode: string;
  fullName: string;
  outlet: string;
  activated: boolean;
}

const PLACEHOLDER: Credential = {
  locatorCode: '',
  fullName: '',
  outlet: '',
  activated: false,
};

export function useCredential(): Credential {
  // TODO(#4): fetch from the authenticated profile once auth/profile exists.
  return PLACEHOLDER;
}

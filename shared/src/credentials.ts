/**
 * Pure helpers for the press-team-issued journalist credential number.
 *
 * The credential follows a credit-card number format (VISA/MasterCard):
 * 16 digits, Luhn-valid, issued brand VISA (leading 4) or MasterCard
 * (51-55 or 2221-2720). Shared between the server (authoritative check)
 * and the app (validation before submitting).
 */

export type CardBrand = 'visa' | 'mastercard';

export const CREDENTIAL_LENGTH = 16;

/** Luhn checksum over a string of digits. */
export function isValidLuhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let value = digits.charCodeAt(i) - 48;
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Brand detection by IIN ranges (VISA 4, MasterCard 51-55 / 2221-2720). */
export function detectBrand(digits: string): CardBrand | null {
  if (/^4\d+$/.test(digits)) return 'visa';
  if (/^(5[1-5]|2(22[1-9]|2[3-9]\d|[3-6]\d\d|7[01]\d|720))\d+$/.test(digits)) return 'mastercard';
  return null;
}

/** Strips spaces, dashes and other separators, keeping only digits. */
export function normalizeCredential(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Full structural validation of a credential number: 16 digits,
 * known VISA/MasterCard IIN and passing Luhn.
 */
export function isValidCredentialFormat(input: string): boolean {
  const digits = normalizeCredential(input);
  return (
    digits.length === CREDENTIAL_LENGTH && detectBrand(digits) !== null && isValidLuhn(digits)
  );
}

/** Groups digits into 4x4 blocks for display, e.g. "4912 3456 7890 1234". */
export function formatCredential(input: string): string {
  return normalizeCredential(input)
    .slice(0, CREDENTIAL_LENGTH)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** Completes a 15-digit issuer prefix into a Luhn-valid 16-digit number. */
export function completeCredential(prefix15: string): string {
  const digits = normalizeCredential(prefix15);
  if (digits.length !== 15) throw new Error('prefix must be 15 digits');
  for (let check = 0; check <= 9; check++) {
    const candidate = digits + String(check);
    if (isValidLuhn(candidate)) return candidate;
  }
  throw new Error('no Luhn-valid check digit');
}

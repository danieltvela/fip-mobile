import { describe, expect, it } from 'vitest';
import {
  completeCredential,
  detectBrand,
  formatCredential,
  isValidCredentialFormat,
  isValidLuhn,
  normalizeCredential,
} from './credentials.js';

describe('credential format validation', () => {
  it('accepts Luhn-valid VISA and MasterCard 16-digit numbers', () => {
    expect(isValidCredentialFormat('4000123456789017')).toBe(true);
    expect(isValidCredentialFormat('5512123456789007')).toBe(true);
    expect(isValidCredentialFormat('4218001122334400')).toBe(true);
  });

  it('rejects numbers failing the Luhn checksum', () => {
    expect(isValidCredentialFormat('4000123456789018')).toBe(false);
  });

  it('rejects non-VISA/MasterCard brands (wrong IIN)', () => {
    expect(isValidCredentialFormat('3500123456789017')).toBe(false); // Amex
    expect(isValidCredentialFormat('6011111111111111')).toBe(false); // Discover
  });

  it('rejects wrong lengths and non-digit input', () => {
    expect(isValidCredentialFormat('400012345678901')).toBe(false);
    expect(isValidCredentialFormat('40001234567890177')).toBe(false);
    expect(isValidCredentialFormat('abcdefghijklmnop')).toBe(false);
    expect(isValidCredentialFormat('')).toBe(false);
  });

  it('ignores separators before validating', () => {
    expect(isValidCredentialFormat('4000 1234 5678 9017')).toBe(true);
  });
});

describe('brand detection', () => {
  it('detects VISA and MasterCard IIN ranges', () => {
    expect(detectBrand('4000')).toBe('visa');
    expect(detectBrand('5512')).toBe('mastercard');
    expect(detectBrand('2221')).toBe(null);
    expect(detectBrand('2221000000000004')).toBe('mastercard');
    expect(detectBrand('2720000000000008')).toBe('mastercard');
    expect(detectBrand('5112')).toBe('mastercard');
    expect(detectBrand('3500')).toBeNull();
    expect(detectBrand('2200')).toBeNull();
  });
});

describe('formatting helpers', () => {
  it('normalizes input by stripping non-digit separators', () => {
    expect(normalizeCredential('4000 1234-5678 9017')).toBe('4000123456789017');
    expect(isValidLuhn('4000123456789017')).toBe(true);
    expect(isValidLuhn('4000123456789018')).toBe(false);
  });

  it('groups digits into 4x4 blocks', () => {
    expect(formatCredential('4000123456789017')).toBe('4000 1234 5678 9017');
    expect(formatCredential('4000 1234')).toBe('4000 1234');
  });

  it('completes a 15-digit prefix with the Luhn check digit', () => {
    expect(completeCredential('400012345678901')).toBe('4000123456789017');
  });
});

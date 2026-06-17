import { describe, it, expect } from 'vitest';
import { normalizeText, normalizeLabel } from '../../../src/extension/options/options.js';

describe('normalizeText', () => {
  it('replaces newlines and tabs with spaces and trims', () => {
    const input = 'hello\nworld\tthis  is   test';
    const out = normalizeText(input);
    expect(out).toBe('hello world this is test');
  });

  it('returns empty string for non-strings', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });
});

describe('normalizeLabel', () => {
  it('removes newlines and trims spaces', () => {
    const input = '  label\nwith\ttabs  ';
    expect(normalizeLabel(input)).toBe('label with tabs');
  });
});

import { parsePresetUsers } from '../auth.seed';

describe('parsePresetUsers', () => {
  it('parses email:password pairs', () => {
    expect(parsePresetUsers('admin@example.com:secret123')).toEqual([
      { email: 'admin@example.com', password: 'secret123' },
    ]);
  });

  it('parses multiple comma-separated entries', () => {
    expect(
      parsePresetUsers('a@x.com:pass1, b@x.com:pass2'),
    ).toEqual([
      { email: 'a@x.com', password: 'pass1' },
      { email: 'b@x.com', password: 'pass2' },
    ]);
  });

  it('returns empty array when unset', () => {
    expect(parsePresetUsers(undefined)).toEqual([]);
    expect(parsePresetUsers('')).toEqual([]);
  });

  it('throws on invalid format', () => {
    expect(() => parsePresetUsers('invalid')).toThrow('Invalid PRESET_USERS entry');
  });
});

import {
  maxBytesForKind,
  resolveUploadKind,
} from '../upload-policy';

describe('upload-policy', () => {
  it('resolves media kinds', () => {
    expect(resolveUploadKind('image/jpeg')).toBe('image');
    expect(resolveUploadKind('video/mp4')).toBe('video');
    expect(resolveUploadKind('audio/mpeg')).toBe('audio');
    expect(resolveUploadKind('application/pdf')).toBeNull();
  });

  it('applies size limits per kind', () => {
    expect(maxBytesForKind('image')).toBe(10 * 1024 * 1024);
    expect(maxBytesForKind('video')).toBe(200 * 1024 * 1024);
    expect(maxBytesForKind('audio')).toBe(15 * 1024 * 1024);
  });
});

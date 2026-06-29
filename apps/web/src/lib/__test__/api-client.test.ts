import { describe, expect, it } from 'vitest';
import { ApiEnvelope } from '../api-client';

describe('api envelope handling', () => {
  it('documents success shape', () => {
    const body: ApiEnvelope<{ accessToken: string }> = {
      code: 0,
      message: 'success',
      data: { accessToken: 'jwt' },
    };
    expect(body.code).toBe(0);
    expect(body.data.accessToken).toBe('jwt');
  });

  it('documents error shape', () => {
    const body: ApiEnvelope<null> = {
      code: 401,
      message: 'Invalid email or password',
      data: null,
    };
    expect(body.code).not.toBe(0);
    expect(body.message).toBeTruthy();
  });
});

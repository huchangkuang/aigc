import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

describe('middleware', () => {
  it('redirects unauthenticated users from /generate to /login', () => {
    const request = new NextRequest('http://localhost/generate');
    const response = middleware(request);
    expect(response?.headers.get('location')).toBe('http://localhost/login');
  });

  it('redirects authenticated users away from /login', () => {
    const request = new NextRequest('http://localhost/login');
    request.cookies.set('auth-token', 'jwt');
    const response = middleware(request);
    expect(response?.headers.get('location')).toBe('http://localhost/generate');
  });
});

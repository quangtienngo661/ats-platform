// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

vi.mock('./types/constants/urls', () => ({
  SERVER_URL: 'http://127.0.0.1:5000/api',
}));

const tokenFor = (role: string, expired = false) =>
  [
    Buffer.from('{"alg":"HS256"}').toString('base64url'),
    Buffer.from(
      JSON.stringify({
        userId: 'user-1',
        role,
        exp: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600),
      }),
    ).toString('base64url'),
    'unit-test-signature',
  ].join('.');
const requestFor = (path: string, token?: string, refresh?: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      Cookie: [
        token ? `accessToken=${token}` : '',
        refresh ? `refreshToken=${refresh}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    },
  });
const mockRefresh = (role: string) => {
  const token = tokenFor(role);
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { accessToken: token } }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'refreshToken=new-refresh; Path=/',
          },
        }),
      ),
  );
  return token;
};

describe('proxy — route policy and refreshed sessions', () => {
  it.each([
    ['candidate', '/job-postings'],
    ['recruiter', '/dashboard'],
    ['admin', '/department-management'],
    ['org_admin', '/department-management'],
  ])(
    'returns a signed-in %s from the login page to its own landing page',
    async (role, landing) => {
      const response = await proxy(requestFor('/sign-in', tokenFor(role)));
      expect(response.headers.get('location')).toBe(
        `http://localhost:3000${landing}`,
      );
    },
  );

  it('allows an admin with a valid token to open AI configuration', async () => {
    const response = await proxy(
      requestFor('/ai-configuration', tokenFor('admin')),
    );
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('denies a candidate an admin route with a valid access token', async () => {
    const response = await proxy(
      requestFor('/ai-configuration', tokenFor('candidate')),
    );
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('applies the same candidate denial after refreshing an expired token', async () => {
    mockRefresh('candidate');
    const response = await proxy(
      requestFor(
        '/ai-configuration',
        tokenFor('candidate', true),
        'old-refresh',
      ),
    );
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
    expect(response.headers.get('x-middleware-next')).toBeNull();
    expect(response.cookies.get('refreshToken')?.value).toBe('new-refresh');
    expect(response.cookies.get('accessToken')?.value).toBeTruthy();
  });

  it('forwards the refreshed access cookie to server components on the current request', async () => {
    const freshToken = mockRefresh('admin');
    const response = await proxy(
      requestFor('/ai-configuration', tokenFor('admin', true), 'old-refresh'),
    );
    expect(response.cookies.get('accessToken')?.value).toBe(freshToken);
    expect(response.headers.get('x-middleware-request-cookie') ?? '').toContain(
      `accessToken=${freshToken}`,
    );
  });

  it('sends a guest opening a private admin route to staff login', async () => {
    const response = await proxy(requestFor('/ai-configuration'));
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in/admin',
    );
  });

  it('forwards both rotated cookies and preserves unrelated browser preferences', async () => {
    const token = mockRefresh('admin');
    const request = requestFor('/ai-configuration', tokenFor('admin', true), 'old-refresh');
    request.cookies.set('language', 'vi');
    const response = await proxy(request);
    const forwarded = response.headers.get('x-middleware-request-cookie');
    expect(forwarded).toContain(`accessToken=${token}`);
    expect(forwarded).toContain('refreshToken=new-refresh');
    expect(forwarded).toContain('language=vi');
    expect(forwarded).not.toContain('old-refresh');
    expect(response.headers.get('x-middleware-request-authorization')).toBe(`Bearer ${token}`);
  });

  it('keeps the refresh cookie if the API does not rotate it', async () => {
    const token = tokenFor('admin');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ data: { accessToken: token } }), { status: 200 },
    )));
    const response = await proxy(requestFor('/ai-configuration', undefined, 'retained-refresh'));
    expect(response.headers.get('x-middleware-request-cookie')).toContain('refreshToken=retained-refresh');
    expect(response.cookies.get('refreshToken')).toBeUndefined();
  });

  it('returns to sign-in when refresh fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 401 })),
    );
    const response = await proxy(
      requestFor('/my-cvs', tokenFor('candidate', true), 'bad-refresh'),
    );
    const redirect = new URL(response.headers.get('location')!);
    expect(redirect.pathname).toBe('/sign-in');
    expect(redirect.searchParams.get('session_expired')).toBe('true');
  });
});

describe('proxy — GĐ1 organization-admin boundaries (A2)', () => {
  const organizationPaths = [
    '/department-management',
    '/recruiter-management',
    '/ai-configuration',
    '/dashboard',
    '/jobs',
    '/interviews',
    '/my-profile',
  ];
  const platformPaths = [
    '/user-management',
    '/skill-management',
    '/interview-topic-management',
    '/job-category-management',
  ];

  it.each(organizationPaths)(
    'allows org_admin to open %s with a fresh access token',
    async (path) => {
      const response = await proxy(requestFor(path, tokenFor('org_admin')));
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('x-middleware-next')).toBe('1');
    },
  );

  it.each(organizationPaths)(
    'keeps org_admin access to %s after refresh',
    async (path) => {
      const freshToken = mockRefresh('org_admin');
      const response = await proxy(
        requestFor(path, tokenFor('org_admin', true), 'old-refresh'),
      );
      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(response.cookies.get('accessToken')?.value).toBe(freshToken);
      expect(response.headers.get('x-middleware-request-cookie')).toContain(
        `accessToken=${freshToken}`,
      );
    },
  );

  it.each(platformPaths)(
    'denies org_admin access to the platform-only page %s before and after refresh',
    async (path) => {
      const fresh = await proxy(requestFor(path, tokenFor('org_admin')));
      mockRefresh('org_admin');
      const refreshed = await proxy(
        requestFor(path, tokenFor('org_admin', true), 'old-refresh'),
      );
      for (const response of [fresh, refreshed]) {
        expect(response.headers.get('x-middleware-next')).toBeNull();
        expect(new URL(response.headers.get('location')!).pathname).not.toBe(path);
      }
      expect(refreshed.headers.get('location')).toBe(fresh.headers.get('location'));
    },
  );

  it.each(['/recruiter-management', '/my-profile', '/recruiter-management/detail']) (
    'requires staff login for a guest opening %s',
    async (path) => {
      const response = await proxy(requestFor(path));
      expect(response.headers.get('x-middleware-next')).toBeNull();
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/sign-in/admin',
      );
    },
  );

  it.each(['/recruiter-management', '/interviews', '/my-profile'])(
    'allows platform admin to open staff page %s',
    async (path) => {
      const response = await proxy(requestFor(path, tokenFor('admin')));
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(response.headers.get('location')).toBeNull();
    },
  );

  it.each(['/recruiter-management', '/my-profile'])(
    'denies candidates the staff page %s',
    async (path) => {
      const response = await proxy(requestFor(path, tokenFor('candidate')));
      expect(response.headers.get('x-middleware-next')).toBeNull();
      expect(response.headers.get('location')).toBe('http://localhost:3000/');
    },
  );
});

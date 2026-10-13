// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logoutAction, signInAction } from './auth.action';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
  set: vi.fn(),
}));
vi.mock('axios', () => ({ default: { post: mocks.post } }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.get, delete: mocks.remove, set: mocks.set }),
}));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock('@/types/constants/urls', () => ({
  SERVER_URL: 'http://127.0.0.1:5000/api',
}));

describe('logoutAction — revoke the server session', () => {
  beforeEach(() => {
    mocks.post.mockResolvedValue({});
    mocks.get.mockImplementation((name) => ({
      value: name === 'accessToken' ? 'access-test' : 'row-id.refresh-test',
    }));
  });

  it('sends the refresh cookie required by AuthService.logout to revoke the token', async () => {
    await expect(logoutAction()).rejects.toThrow('redirect:/sign-in');
    expect(mocks.post).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/auth/logout',
      {},
      {
        headers: {
          Authorization: 'Bearer access-test',
          Cookie: 'refreshToken=row-id.refresh-test',
        },
      },
    );
    expect(mocks.remove.mock.calls).toEqual([
      ['accessToken'],
      ['refreshToken'],
    ]);
  });

  it('clears both browser cookies even when the API is unavailable', async () => {
    mocks.post.mockRejectedValue(new Error('offline'));
    await expect(logoutAction()).resolves.toEqual({
      success: false,
      message: 'Đăng xuất có lỗi nhưng đã xoá session ở client',
    });
    expect(mocks.remove.mock.calls).toEqual([
      ['accessToken'],
      ['refreshToken'],
    ]);
  });
});

const accessTokenFor = (role: string) => [
  Buffer.from('{"alg":"HS256"}').toString('base64url'),
  Buffer.from(JSON.stringify({ userId: 'org-admin-1', role, fullName: 'Quản trị A' })).toString('base64url'),
  'test-signature',
].join('.');

const loginFormFor = (role: string) => {
  const form = new FormData();
  form.set('email', 'organization-admin@ats.test');
  form.set('password', 'OrgAdmin@123');
  form.set('role', role);
  return form;
};

describe('signInAction — organization-admin portal (A1)', () => {
  beforeEach(() => {
    mocks.post.mockResolvedValue({
      data: { data: { accessToken: accessTokenFor('org_admin') } },
      headers: { 'set-cookie': ['refreshToken=org-session.refresh; Path=/; HttpOnly'] },
    });
  });

  it('sets both session cookies and sends org_admin to department management', async () => {
    await expect(signInAction({ success: false, message: '' }, loginFormFor('org_admin')))
      .rejects.toThrow('redirect:/department-management');
    expect(mocks.post).toHaveBeenCalledWith(
      'http://127.0.0.1:5000/api/auth/login',
      { email: 'organization-admin@ats.test', password: 'OrgAdmin@123' },
    );
    expect(mocks.set.mock.calls.map(([cookie]) => ({ name: cookie.name, value: cookie.value })))
      .toEqual([
        { name: 'accessToken', value: accessTokenFor('org_admin') },
        { name: 'refreshToken', value: 'org-session.refresh' },
      ]);
  });

  it.each(['admin', 'recruiter', 'candidate'])(
    'rejects an org_admin account in the %s portal without setting cookies',
    async (selectedRole) => {
      await expect(signInAction({ success: false, message: '' }, loginFormFor(selectedRole)))
        .resolves.toEqual({
          success: false,
          message: 'Tài khoản của bạn không có quyền truy cập portal này',
        });
      expect(mocks.set).not.toHaveBeenCalled();
    },
  );

  it.each(['candidate', 'recruiter'])(
    'rejects a %s account selecting the organization-admin portal',
    async (tokenRole) => {
      mocks.post.mockResolvedValue({
        data: { data: { accessToken: accessTokenFor(tokenRole) } },
        headers: {},
      });
      const result = await signInAction({ success: false, message: '' }, loginFormFor('org_admin'));
      expect(result).toEqual({
        success: false,
        message: 'Tài khoản của bạn không có quyền truy cập portal này',
      });
      expect(mocks.set).not.toHaveBeenCalled();
    },
  );

  it('retains the permitted platform-admin login through the recruiter portal', async () => {
    mocks.post.mockResolvedValue({
      data: { data: { accessToken: accessTokenFor('admin') } },
      headers: {},
    });
    await expect(signInAction({ success: false, message: '' }, loginFormFor('recruiter')))
      .rejects.toThrow('redirect:/dashboard');
    expect(mocks.set).toHaveBeenCalledTimes(1);
  });
});

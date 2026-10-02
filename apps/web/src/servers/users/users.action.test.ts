// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserAction, updateUserAction } from './users.action';

const mocks = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { post: mocks.post, patch: mocks.patch } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));

const initialState = { success: false, message: '' };
const formFor = (role = 'org_admin', organizationId = 'org-b') => {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    userId: 'user-1', fullName: 'Quản trị B', email: 'admin-b@ats.test',
    password: 'OrgAdmin@123', role, status: 'active', organizationId,
  })) form.set(name, value);
  return form;
};

describe('User actions — organization binding (A3)', () => {
  beforeEach(() => {
    mocks.post.mockResolvedValue({ data: { userId: 'user-1' } });
    mocks.patch.mockResolvedValue({ data: { userId: 'user-1' } });
  });

  it('sends the selected organization with a new org_admin account', async () => {
    const result = await createUserAction(initialState, formFor('org_admin', 'org-b'));
    expect(result.success).toBe(true);
    expect(mocks.post).toHaveBeenCalledWith('/users', {
      fullName: 'Quản trị B', email: 'admin-b@ats.test', password: 'OrgAdmin@123',
      role: 'org_admin', status: 'active', organizationId: 'org-b',
    });
    expect(mocks.revalidate).toHaveBeenCalledWith('/user-management');
  });

  it('sends the changed organization when updating an org_admin', async () => {
    const form = formFor('org_admin', 'org-a');
    form.set('password', '');
    const result = await updateUserAction(initialState, form);
    expect(result.success).toBe(true);
    expect(mocks.patch).toHaveBeenCalledWith('/users/user-1', {
      fullName: 'Quản trị B', email: 'admin-b@ats.test', role: 'org_admin',
      status: 'active', organizationId: 'org-a',
    });
  });

  it.each(['', '   '])('rejects creating org_admin with organization %j before HTTP', async (organizationId) => {
    const result = await createUserAction(initialState, formFor('org_admin', organizationId));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/tổ chức/i);
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it('rejects editing org_admin with an empty organization before HTTP', async () => {
    const result = await updateUserAction(initialState, formFor('org_admin', ''));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/tổ chức/i);
    expect(mocks.patch).not.toHaveBeenCalled();
  });

  it.each(['admin', 'candidate', 'recruiter'])(
    'omits a stale organization field when creating or editing %s',
    async (role) => {
      await createUserAction(initialState, formFor(role, 'org-b'));
      await updateUserAction(initialState, formFor(role, 'org-b'));
      for (const call of [mocks.post.mock.calls[0], mocks.patch.mock.calls[0]]) {
        expect(call[1]).toMatchObject({ role });
        expect(call[1]).not.toHaveProperty('organizationId');
      }
    },
  );
});

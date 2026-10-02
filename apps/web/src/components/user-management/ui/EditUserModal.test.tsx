// Component behaviour only; UI keeps role locked while organization binding is editable.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '@ats-platform/types';
import type { IUserResponseDto } from '@/types/interfaces/user.interface';
import { EditUserModal } from './EditUserModal';

const mocks = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('@/servers/users/users.action', () => ({ updateUserAction: mocks.update }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const organizations = [
  { organizationId: 'org-a', name: 'Tổ chức A', slug: 'org-a' },
  { organizationId: 'org-b', name: 'Tổ chức B', slug: 'org-b' },
];
const organizationAdmin = {
  userId: 'user-a', fullName: 'Quản trị A', email: 'admin-a@ats.test',
  role: UserRole.org_admin, status: UserStatus.active, organizationId: 'org-a',
  createdAt: '2026-09-29T00:00:00.000Z', recruiter: null,
} as unknown as IUserResponseDto;

describe('EditUserModal — org_admin organization binding (A3)', () => {
  beforeEach(() => {
    mocks.update.mockResolvedValue({ success: false, message: '' });
  });

  it('names the locked org_admin role and starts with its current organization', () => {
    render(<EditUserModal user={organizationAdmin} organizations={organizations} onClose={vi.fn()} onUpdated={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Quản trị tổ chức' })).toHaveValue('org_admin');
    expect(screen.getByRole('combobox', { name: 'Vai trò' })).toBeDisabled();
    const organizationSelect = screen.getByRole('combobox', { name: /Tổ chức/ });
    expect(organizationSelect).toHaveValue('org-a');
    expect(organizationSelect).toBeRequired();
  });

  it('submits a changed organization with the same locked org_admin role', async () => {
    const user = userEvent.setup();
    render(<EditUserModal user={organizationAdmin} organizations={organizations} onClose={vi.fn()} onUpdated={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Quản trị tổ chức' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: /Tổ chức/ }), 'org-b');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(mocks.update).toHaveBeenCalledTimes(1));
    const values = Object.fromEntries((mocks.update.mock.calls[0][1] as FormData).entries());
    expect(values).toMatchObject({
      userId: 'user-a', fullName: 'Quản trị A', role: 'org_admin', organizationId: 'org-b',
    });
  });

  it('does not offer organization binding when editing a global candidate account', () => {
    const candidate = { ...organizationAdmin, role: UserRole.candidate, organizationId: null };
    render(<EditUserModal user={candidate} organizations={organizations} onClose={vi.fn()} onUpdated={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Ứng viên' })).toHaveValue('candidate');
    expect(screen.queryByRole('combobox', { name: /Tổ chức/ })).not.toBeInTheDocument();
  });
});

// Component behaviour only; API binding/permissions and persisted rows need real-browser verification.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddUserModal } from './AddUserModal';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/servers/users/users.action', () => ({ createUserAction: mocks.create }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const organizations = [
  { organizationId: 'org-a', name: 'Tổ chức A', slug: 'org-a' },
  { organizationId: 'org-b', name: 'Tổ chức B', slug: 'org-b' },
];

describe('AddUserModal — org_admin organization selection (A3)', () => {
  beforeEach(() => {
    mocks.create.mockResolvedValue({ success: false, message: '' });
  });

  it('requires a specific organization after selecting organization admin', async () => {
    const user = userEvent.setup();
    render(<AddUserModal organizations={organizations} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Quản trị tổ chức' })).toHaveValue('org_admin');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Vai trò' }), 'org_admin');
    const organizationSelect = screen.getByRole('combobox', { name: /Tổ chức/ });
    expect(organizationSelect).toBeRequired();
    expect(organizationSelect).toHaveValue('');
    expect(organizationSelect).toBeInvalid();
    await user.selectOptions(organizationSelect, 'org-b');
    expect(organizationSelect).toHaveValue('org-b');
    expect(organizationSelect).toBeValid();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('submits the selected organization with the org_admin role', async () => {
    const user = userEvent.setup();
    render(<AddUserModal organizations={organizations} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Quản trị tổ chức' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Vai trò' }), 'org_admin');
    await user.type(screen.getByRole('textbox', { name: /Họ và tên/ }), 'Quản trị B');
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'admin-b@ats.test');
    await user.type(screen.getByLabelText(/^Mật khẩu/), 'OrgAdmin@123');
    await user.selectOptions(screen.getByRole('combobox', { name: /Tổ chức/ }), 'org-b');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const values = Object.fromEntries((mocks.create.mock.calls[0][1] as FormData).entries());
    expect(values).toMatchObject({
      fullName: 'Quản trị B', email: 'admin-b@ats.test', password: 'OrgAdmin@123',
      role: 'org_admin', organizationId: 'org-b', status: 'active',
    });
  });

  it('removes the organization binding when switching back to a recruiter account', async () => {
    const user = userEvent.setup();
    render(<AddUserModal organizations={organizations} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Quản trị tổ chức' })).toBeInTheDocument();
    const roleSelect = screen.getByRole('combobox', { name: 'Vai trò' });
    await user.selectOptions(roleSelect, 'org_admin');
    await user.selectOptions(screen.getByRole('combobox', { name: /Tổ chức/ }), 'org-b');
    await user.selectOptions(roleSelect, 'recruiter');
    expect(screen.queryByRole('combobox', { name: /Tổ chức/ })).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: /Họ và tên/ }), 'Recruiter B');
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'recruiter-b@ats.test');
    await user.type(screen.getByLabelText(/^Mật khẩu/), 'Recruiter@123');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const values = Object.fromEntries((mocks.create.mock.calls[0][1] as FormData).entries());
    expect(values.role).toBe('recruiter');
    expect(values).not.toHaveProperty('organizationId');
  });

  it('keeps org_admin creation invalid when no organizations are available', async () => {
    const user = userEvent.setup();
    render(<AddUserModal organizations={[]} onClose={vi.fn()} onCreated={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Quản trị tổ chức' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Vai trò' }), 'org_admin');
    expect(screen.getByRole('combobox', { name: /Tổ chức/ })).toBeInvalid();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

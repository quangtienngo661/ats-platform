// Component behaviour only: navigation, cookies and real persistence are verified separately.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StaffLoginForm from './StaffLoginForm';

const mocks = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock('@/servers/auth/auth.action', () => ({ signInAction: mocks.signIn }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/lib/toast', () => ({ toast: { info: vi.fn() } }));

describe('StaffLoginForm — organization-admin choice (A1)', () => {
  beforeEach(() => {
    mocks.signIn.mockResolvedValue({ success: false, message: '' });
  });

  it('offers the organization-admin portal and submits its exact role', async () => {
    const user = userEvent.setup();
    render(<StaffLoginForm />);
    await user.click(screen.getByRole('button', { name: 'Quản trị tổ chức' }));
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'org-admin@ats.test');
    await user.type(screen.getByLabelText('Mật khẩu'), 'OrgAdmin@123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập với tư cách Quản trị tổ chức' }));

    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledTimes(1));
    const values = Object.fromEntries((mocks.signIn.mock.calls[0][1] as FormData).entries());
    expect(values).toEqual({
      email: 'org-admin@ats.test', password: 'OrgAdmin@123',
      role: 'org_admin', callbackUrl: '',
    });
  });
});

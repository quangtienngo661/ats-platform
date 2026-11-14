// Component behaviour only: the server action is mocked; cookies and navigation are verified elsewhere.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './LoginForm';

const mocks = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock('@/servers/auth/auth.action', () => ({ signInAction: mocks.signIn }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...await importOriginal<typeof import('next/navigation')>(), useSearchParams: () => new URLSearchParams() }));

describe('LoginForm', () => {
  beforeEach(() => {
    mocks.signIn.mockReset();
    mocks.signIn.mockResolvedValue({ success: false, message: '' });
  });

  it('labels the email field "Email" and lets the browser autofill it', () => {
    render(<LoginForm />);
    const email = screen.getByRole('textbox', { name: 'Email' });
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'email');
    expect(email).toHaveAttribute('spellcheck', 'false');
  });

  it('shows and hides the password, renaming its toggle each time', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const password = screen.getByLabelText('Mật khẩu');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(password).toHaveAttribute('type', 'text');
    const hide = screen.getByRole('button', { name: 'Ẩn mật khẩu' });
    expect(hide).toHaveAttribute('aria-pressed', 'true');

    await user.click(hide);
    expect(password).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Hiện mật khẩu' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('announces the server error in an alert region', async () => {
    mocks.signIn.mockResolvedValue({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    const user = userEvent.setup();
    render(<LoginForm />);
    expect(screen.queryByRole('alert')).toBeNull();

    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'a@b.vn');
    await user.type(screen.getByLabelText('Mật khẩu'), 'sai-mat-khau');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.');
  });
});

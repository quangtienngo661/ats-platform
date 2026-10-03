import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublicHeader } from './PublicHeader';

vi.mock('next/navigation', () => ({
  usePathname: () => '/job-postings',
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/servers/auth/auth.action', () => ({ logoutAction: vi.fn() }));
vi.mock('@/stores/useSocketStore', () => ({ useSocketStore: () => ({ disconnect: vi.fn() }) }));
vi.mock('@/components/notifications/NotificationDropdown', () => ({ NotificationDropdown: () => null }));

describe('PublicHeader — the interview schedule menu item (C6)', () => {
  it('shows a signed-in candidate the way to their interview schedule', () => {
    render(<PublicHeader userInfo={{ fullName: 'Nguyễn Văn A', role: 'candidate' }} />);
    expect(screen.getByRole('link', { name: 'Lịch phỏng vấn' })).toHaveAttribute('href', '/my-interviews');
  });

  it('does not show a guest the interview schedule', () => {
    render(<PublicHeader userInfo={null} />);
    expect(screen.queryByRole('link', { name: 'Lịch phỏng vấn' })).toBeNull();
  });
});

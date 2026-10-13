import { render, screen, within } from '@testing-library/react';
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

describe('PublicHeader — desktop navigation at tablet widths', () => {
  it('keeps all five candidate navigation labels on one line at every width', () => {
    render(<PublicHeader userInfo={{ fullName: 'Nguyễn Văn A', role: 'candidate' }} />);
    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links).toHaveLength(5);
    for (const link of links) {
      expect(link).toHaveClass('whitespace-nowrap', 'px-1.5', 'lg:px-3');
    }
  });

  it('uses compact tablet spacing without hiding overflowing navigation links', () => {
    render(<PublicHeader userInfo={{ fullName: 'Nguyễn Văn A', role: 'candidate' }} />);
    const navigation = screen.getByRole('navigation');
    expect(navigation).not.toHaveClass('overflow-hidden');
    expect(navigation).toHaveClass('min-w-0', 'gap-0.5', 'lg:gap-1');
    expect(navigation.parentElement).toHaveClass('px-4', 'lg:px-6', 'gap-3', 'lg:gap-6');
  });

  it('gives the desktop navigation the free width without an empty flex spacer', () => {
    render(<PublicHeader userInfo={{ fullName: 'Nguyễn Văn A', role: 'candidate' }} />);
    const navigation = screen.getByRole('navigation');
    const container = navigation.parentElement;
    if (!container) throw new Error('Desktop navigation must have a parent container');
    const emptySpacers = Array.from(container.children).filter(
      sibling => sibling !== navigation && sibling.classList.contains('flex-1') && !sibling.hasChildNodes(),
    );
    expect(emptySpacers).toHaveLength(0);
  });
});

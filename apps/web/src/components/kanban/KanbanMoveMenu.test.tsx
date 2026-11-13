import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { KanbanStoreProvider } from '@/stores/useKanbanStore';
import { updateApplicationStatusAction } from '@/servers/applications/applications.action';
import { toast } from '@/lib/toast';
import KanbanClient from './KanbanClient';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));
vi.mock('@/servers/applications/applications.action', () => ({
  updateApplicationStatusAction: vi.fn(),
  triggerCvScreeningAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const socket = { status: 'disconnected', onEvent: vi.fn(), offEvent: vi.fn() };
vi.mock('@/stores/useSocketStore', () => ({ useSocketStore: () => socket }));

const applicant = {
  applicationId: 'app-1',
  status: 'applied',
  appliedAt: '2026-11-10T00:00:00.000Z',
  candidate: { user: { fullName: 'Nguyễn Văn An' } },
  jobPosting: { title: 'Backend Developer', locationType: 'remote' },
} as unknown as IApplicationDto;

function renderBoard(board: Record<string, IApplicationDto[]> = { applied: [applicant] }) {
  return render(
    <KanbanStoreProvider initialState={{ board, cancelled: [] }}>
      <KanbanClient jobId="job-1" />
    </KanbanStoreProvider>,
  );
}

type User = ReturnType<typeof userEvent.setup>;

/** Moves focus down the open menu with the arrow key until `item` has it (bounded, so a missing item fails). */
async function arrowTo(user: User, item: HTMLElement) {
  for (let i = 0; i < 10 && document.activeElement !== item; i++) await user.keyboard('{ArrowDown}');
  expect(item).toHaveFocus();
}

/**
 * Keyboard only: jsdom gives every element a zero-size rect, so Radix's pointer grace area closes a submenu as
 * soon as the mouse moves into it. The keys are the path a keyboard user takes anyway.
 */
async function moveTo(stageLabel: string) {
  const user = userEvent.setup();
  renderBoard();
  screen.getByRole('button', { name: 'Tùy chọn' }).focus();
  await user.keyboard('{Enter}');
  await arrowTo(user, await screen.findByRole('menuitem', { name: 'Chuyển sang vòng…' }));
  await user.keyboard('{ArrowRight}');
  await arrowTo(user, await screen.findByRole('menuitem', { name: stageLabel }));
  await user.keyboard('{Enter}');
}

describe('Kanban — "Chuyển sang vòng…" menu', () => {
  beforeEach(() => {
    vi.mocked(updateApplicationStatusAction).mockResolvedValue({ success: true, message: '' });
  });

  it('moves the applicant to the chosen next stage through the same status action as a drop', async () => {
    await moveTo('Sàng lọc');

    expect(updateApplicationStatusAction).toHaveBeenCalledTimes(1);
    expect(updateApplicationStatusAction).toHaveBeenCalledWith('app-1', 'screening');
  });

  it('keeps the drop guard: skipping two stages is refused with the existing toast and no request', async () => {
    await moveTo('Đã tuyển');

    expect(updateApplicationStatusAction).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      'Thao tác không hợp lệ',
      'Hệ thống không cho phép kéo ứng viên vượt qua 2 vòng cùng lúc.',
    );
  });

  it('lists every other stage except the current one and "cancelled"', async () => {
    const user = userEvent.setup();
    renderBoard();
    screen.getByRole('button', { name: 'Tùy chọn' }).focus();
    await user.keyboard('{Enter}');
    await arrowTo(user, await screen.findByRole('menuitem', { name: 'Chuyển sang vòng…' }));
    await user.keyboard('{ArrowRight}');

    const submenu = (await screen.findAllByRole('menu')).at(-1) as HTMLElement;
    const names = Array.from(submenu.querySelectorAll('[role="menuitem"]'), (el) => el.textContent);
    expect(names).toEqual(['Sàng lọc', 'Phỏng vấn', 'Offer', 'Đã tuyển', 'Từ chối']);
  });

  it('ArrowLeft leaves the submenu, Esc closes the menu and returns focus to the "Tùy chọn" button', async () => {
    const user = userEvent.setup();
    renderBoard();
    const trigger = screen.getByRole('button', { name: 'Tùy chọn' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const subTrigger = await screen.findByRole('menuitem', { name: 'Chuyển sang vòng…' });
    await arrowTo(user, subTrigger);
    await user.keyboard('{ArrowRight}');
    await screen.findByRole('menuitem', { name: 'Sàng lọc' });

    await user.keyboard('{ArrowLeft}');
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Sàng lọc' })).toBeNull());
    expect(subTrigger).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(updateApplicationStatusAction).not.toHaveBeenCalled();
  });

  it('keeps "AI Sàng lọc CV" disabled outside the screening stage and says why', async () => {
    const user = userEvent.setup();
    renderBoard();
    screen.getByRole('button', { name: 'Tùy chọn' }).focus();
    await user.keyboard('{Enter}');

    const screening = await screen.findByRole('menuitem', { name: 'AI Sàng lọc CV' });
    expect(screening).toHaveAttribute('aria-disabled', 'true');
    expect(screening).toHaveAccessibleDescription('Chỉ áp dụng ở bước Sàng lọc');
  });

  it('opens the screening dialog from "AI Sàng lọc CV" and returns focus to "Tùy chọn" when it closes', async () => {
    const user = userEvent.setup();
    renderBoard({ screening: [{ ...applicant, status: 'screening', screening: { status: 'pending' } } as unknown as IApplicationDto] });
    const trigger = screen.getByRole('button', { name: 'Tùy chọn' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await arrowTo(user, await screen.findByRole('menuitem', { name: 'AI Sàng lọc CV' }));
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('dialog', { name: 'Cấu hình sàng lọc AI' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

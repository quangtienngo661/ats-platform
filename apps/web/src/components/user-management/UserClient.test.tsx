// Client-side list states only; the user list itself comes from getUsersAction (users.action.test.ts).
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '@ats-platform/types';
import type { IUserResponseDto } from '@/types/interfaces/user.interface';
import { deleteUserAction } from '@/servers/users/users.action';
import UserClient from './UserClient';

vi.mock('@/servers/users/users.action', () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
  deleteUserAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const users = [
  {
    userId: 'user-a', fullName: 'Nguyễn Văn A', email: 'a@ats.test',
    role: UserRole.recruiter, status: UserStatus.active, organizationId: null,
    createdAt: '2026-09-29T00:00:00.000Z', recruiter: null,
  },
  {
    userId: 'user-b', fullName: 'Trần Thị B', email: 'b@ats.test',
    role: UserRole.admin, status: UserStatus.inactive, organizationId: null,
    createdAt: '2026-09-30T00:00:00.000Z', recruiter: null,
  },
] as unknown as IUserResponseDto[];

/** Header row plus one row per user. */
const rowsFor = (count: number) => count + 1;

type User = ReturnType<typeof userEvent.setup>;

/** Opens the "Tùy chọn" menu of the row with `name` from the keyboard and activates `item`. */
async function chooseFromRowMenu(user: User, name: string, item: string) {
  const row = screen.getByRole('row', { name: new RegExp(name) });
  within(row).getByRole('button', { name: 'Tùy chọn' }).focus();
  await user.keyboard('{Enter}');
  const target = await screen.findByRole('menuitem', { name: item });
  // Bounded, so a missing item fails instead of looping.
  for (let i = 0; i < 5 && document.activeElement !== target; i++) await user.keyboard('{ArrowDown}');
  expect(target).toHaveFocus();
  await user.keyboard('{Enter}');
  return row;
}

describe('UserClient — empty and no-match states', () => {
  it('says there are no users yet when the list is empty', () => {
    render(<UserClient initialUsers={[]} organizations={[]} />);
    expect(screen.getByRole('heading', { name: 'Chưa có người dùng' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Không có người dùng khớp' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('says no user matches when a search finds nobody', async () => {
    const user = userEvent.setup();
    render(<UserClient initialUsers={users} organizations={[]} />);
    expect(screen.getAllByRole('row')).toHaveLength(rowsFor(2));

    await user.type(screen.getByRole('textbox', { name: 'Tìm người dùng' }), 'không ai tên này');

    expect(await screen.findByRole('heading', { name: 'Không có người dùng khớp' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Chưa có người dùng' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('clears the search and the filters from the no-match state', async () => {
    const user = userEvent.setup();
    render(<UserClient initialUsers={users} organizations={[]} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc trạng thái người dùng' }), UserStatus.inactive);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc vai trò' }), UserRole.org_admin);
    await user.type(screen.getByRole('textbox', { name: 'Tìm người dùng' }), 'ats.test');
    expect(await screen.findByRole('heading', { name: 'Không có người dùng khớp' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));

    expect(screen.getByRole('textbox', { name: 'Tìm người dùng' })).toHaveValue('');
    // The button that had focus is gone with the no-match state; focus lands in the toolbar, not on <body>.
    expect(screen.getByRole('textbox', { name: 'Tìm người dùng' })).toHaveFocus();
    expect(screen.getByRole('combobox', { name: 'Lọc vai trò' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Lọc trạng thái người dùng' })).toHaveValue('');
    expect(screen.getAllByRole('row')).toHaveLength(rowsFor(2));
    expect(screen.queryByRole('heading', { name: 'Không có người dùng khớp' })).not.toBeInTheDocument();
  });
});

describe('UserClient — row menu', () => {
  it('asks to confirm a delete with focus on "Hủy", and cancelling returns focus to the row menu', async () => {
    const user = userEvent.setup();
    render(<UserClient initialUsers={users} organizations={[]} />);

    const row = await chooseFromRowMenu(user, 'Nguyễn Văn A', 'Xóa');

    expect(await within(row).findByText('Xác nhận xóa?')).toBeVisible();
    await waitFor(() => expect(within(row).getByRole('button', { name: 'Hủy' })).toHaveFocus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(within(row).getByRole('button', { name: 'Tùy chọn' })).toHaveFocus());
    expect(within(row).queryByText('Xác nhận xóa?')).not.toBeInTheDocument();
    expect(deleteUserAction).not.toHaveBeenCalled();
  });

  it('deletes only the confirmed user', async () => {
    vi.mocked(deleteUserAction).mockResolvedValue({ success: true, message: 'Xóa người dùng thành công' });
    const user = userEvent.setup();
    render(<UserClient initialUsers={users} organizations={[]} />);

    const row = await chooseFromRowMenu(user, 'Nguyễn Văn A', 'Xóa');
    await user.click(await within(row).findByRole('button', { name: 'Xóa' }));

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(rowsFor(1)));
    expect(deleteUserAction).toHaveBeenCalledTimes(1);
    expect(deleteUserAction).toHaveBeenCalledWith('user-a');
    expect(screen.getByRole('row', { name: /Trần Thị B/ })).toBeVisible();
  });

  it('opens the edit dialog for that user and returns focus to its row menu on close', async () => {
    const user = userEvent.setup();
    render(<UserClient initialUsers={users} organizations={[]} />);

    const row = await chooseFromRowMenu(user, 'Trần Thị B', 'Chỉnh sửa');

    const dialog = await screen.findByRole('dialog', { name: 'Chỉnh sửa người dùng' });
    expect(within(dialog).getByRole('textbox', { name: 'Họ và tên' })).toHaveValue('Trần Thị B');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(within(row).getByRole('button', { name: 'Tùy chọn' })).toHaveFocus());
  });
});

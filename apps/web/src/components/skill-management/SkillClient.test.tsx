// Client-side states of the skill list; the actions themselves are mocked.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ISkillDto } from '@/types/interfaces/skill.interface';
import { deleteSkillAction } from '@/servers/skills/skills.action';
import SkillClient from './SkillClient';

vi.mock('@/servers/skills/skills.action', () => ({
  createSkillAction: vi.fn(),
  updateSkillAction: vi.fn(),
  deleteSkillAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const skills = [
  { skillId: 'skill-a', name: 'TypeScript', category: 'Ngôn ngữ' },
  { skillId: 'skill-b', name: 'Docker', category: 'DevOps' },
] as unknown as ISkillDto[];

type User = ReturnType<typeof userEvent.setup>;

async function chooseFromRowMenu(user: User, name: string, item: string) {
  const row = screen.getByRole('row', { name: new RegExp(name) });
  within(row).getByRole('button', { name: 'Tùy chọn' }).focus();
  await user.keyboard('{Enter}');
  const target = await screen.findByRole('menuitem', { name: item });
  for (let i = 0; i < 5 && document.activeElement !== target; i++) await user.keyboard('{ArrowDown}');
  expect(target).toHaveFocus();
  await user.keyboard('{Enter}');
  return row;
}

describe('SkillClient — empty and no-match states', () => {
  it('says there are no skills yet, with an add action that does not repeat the toolbar button', () => {
    render(<SkillClient skills={[]} />);
    expect(screen.getByRole('heading', { name: 'Chưa có kỹ năng' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Thêm kỹ năng đầu tiên' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Thêm kỹ năng' })).toHaveLength(1);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('offers "Xóa tìm kiếm" when only the search is set, and focuses the search field after clearing', async () => {
    const user = userEvent.setup();
    render(<SkillClient skills={skills} />);
    await user.type(screen.getByRole('textbox', { name: 'Tìm kỹ năng' }), 'không có');

    expect(await screen.findByRole('heading', { name: 'Không có kỹ năng khớp' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));

    expect(screen.getByRole('textbox', { name: 'Tìm kỹ năng' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Tìm kỹ năng' })).toHaveFocus();
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('offers "Xóa bộ lọc" when the category filter is set too, and resets both', async () => {
    const user = userEvent.setup();
    render(<SkillClient skills={skills} />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Lọc danh mục kỹ năng' }), 'DevOps');
    await user.type(screen.getByRole('textbox', { name: 'Tìm kỹ năng' }), 'type');

    expect(await screen.findByRole('heading', { name: 'Không có kỹ năng khớp' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));

    expect(screen.getByRole('combobox', { name: 'Lọc danh mục kỹ năng' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Tìm kỹ năng' })).toHaveValue('');
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
});

describe('SkillClient — row menu', () => {
  it('opens the edit dialog for that skill', async () => {
    const user = userEvent.setup();
    render(<SkillClient skills={skills} />);

    await chooseFromRowMenu(user, 'Docker', 'Chỉnh sửa');

    const dialog = await screen.findByRole('dialog', { name: 'Chỉnh sửa kỹ năng' });
    expect(within(dialog).getByRole('textbox', { name: 'Tên kỹ năng' })).toHaveValue('Docker');
  });

  it('asks to confirm, then deletes only that skill', async () => {
    vi.mocked(deleteSkillAction).mockResolvedValue({ success: true, message: 'Đã xóa' });
    const user = userEvent.setup();
    render(<SkillClient skills={skills} />);

    const row = await chooseFromRowMenu(user, 'TypeScript', 'Xóa');
    expect(await within(row).findByText('Xác nhận xóa?')).toBeVisible();
    expect(deleteSkillAction).not.toHaveBeenCalled();
    await user.click(within(row).getByRole('button', { name: 'Xóa' }));

    await waitFor(() => expect(deleteSkillAction).toHaveBeenCalledWith('skill-a'));
    expect(deleteSkillAction).toHaveBeenCalledTimes(1);
  });
});

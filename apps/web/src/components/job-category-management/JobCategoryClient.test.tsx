// Client-side states of the category tree; the actions themselves are mocked.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IJobCategoryDto } from '@/types/interfaces/job-category.interface';
import { deleteJobCategoryAction } from '@/servers/job-categories/job-categories.action';
import JobCategoryClient from './JobCategoryClient';

vi.mock('@/servers/job-categories/job-categories.action', () => ({
  createJobCategoryAction: vi.fn(),
  updateJobCategoryAction: vi.fn(),
  deleteJobCategoryAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const categories = [
  {
    categoryId: 'cat-it',
    name: 'Công nghệ',
    parentCategoryId: null,
    jobPostings: [{ jobId: 'j1' }],
    childCategories: [
      { categoryId: 'cat-fe', name: 'Frontend', parentCategoryId: 'cat-it', jobPostings: [], childCategories: [] },
    ],
  },
  { categoryId: 'cat-hr', name: 'Nhân sự', parentCategoryId: null, jobPostings: [], childCategories: [] },
] as unknown as IJobCategoryDto[];

type User = ReturnType<typeof userEvent.setup>;

/** Opens the "Tùy chọn" menu of the tree row named `name` from the keyboard and activates `item`. */
async function chooseFromRowMenu(user: User, name: string, item: string) {
  screen.getByRole('button', { name: 'Tùy chọn', description: name }).focus();
  await user.keyboard('{Enter}');
  const target = await screen.findByRole('menuitem', { name: item });
  for (let i = 0; i < 5 && document.activeElement !== target; i++) await user.keyboard('{ArrowDown}');
  expect(target).toHaveFocus();
  await user.keyboard('{Enter}');
}

describe('JobCategoryClient — empty and no-match states', () => {
  it('says there are no categories yet, with an add action that does not repeat the toolbar button', () => {
    render(<JobCategoryClient categories={[]} />);
    expect(screen.getByRole('heading', { name: 'Chưa có danh mục' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Thêm danh mục đầu tiên' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Thêm danh mục' })).toHaveLength(1);
  });

  it('says no category matches and clears the search, returning focus to the search field', async () => {
    const user = userEvent.setup();
    render(<JobCategoryClient categories={categories} />);
    await user.type(screen.getByRole('searchbox', { name: 'Tìm danh mục' }), 'không có gì');

    expect(await screen.findByRole('heading', { name: 'Không có danh mục khớp' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));

    expect(screen.getByRole('searchbox', { name: 'Tìm danh mục' })).toHaveValue('');
    expect(screen.getByRole('searchbox', { name: 'Tìm danh mục' })).toHaveFocus();
    expect(screen.getByText('Công nghệ')).toBeVisible();
  });

  it('keeps a parent visible when only its child matches the search', async () => {
    const user = userEvent.setup();
    render(<JobCategoryClient categories={categories} />);
    await user.type(screen.getByRole('searchbox', { name: 'Tìm danh mục' }), 'front');
    expect(screen.getByText('Công nghệ')).toBeVisible();
    expect(screen.getByText('Frontend')).toBeVisible();
    expect(screen.queryByText('Nhân sự')).not.toBeInTheDocument();
  });
});

describe('JobCategoryClient — tree', () => {
  it('flips aria-expanded and the accessible name of the toggle, and hides the children', async () => {
    const user = userEvent.setup();
    render(<JobCategoryClient categories={categories} />);
    const collapse = screen.getByRole('button', { name: 'Thu gọn Công nghệ' });
    expect(collapse).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Frontend')).toBeVisible();

    await user.click(collapse);

    const expand = screen.getByRole('button', { name: 'Mở rộng Công nghệ' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
  });

  it('indents a child 16 px deeper than its parent', () => {
    render(<JobCategoryClient categories={categories} />);
    const pad = (name: string) => {
      const row = screen.getByText(name).closest('[data-row]') as HTMLElement;
      return parseFloat(row.style.paddingInlineStart);
    };
    expect(pad('Frontend') - pad('Công nghệ')).toBe(16);
  });
});

describe('JobCategoryClient — search keeps the tree honest', () => {
  const busy = [
    {
      categoryId: 'cat-a', name: 'Kinh doanh', parentCategoryId: null, jobPostings: [{ jobId: 'a1' }, { jobId: 'a2' }],
      childCategories: [
        { categoryId: 'c1', name: 'Bán lẻ', parentCategoryId: 'cat-a', jobPostings: [{ jobId: 'b1' }], childCategories: [] },
        { categoryId: 'c2', name: 'Bán sỉ', parentCategoryId: 'cat-a', jobPostings: [{ jobId: 'b2' }, { jobId: 'b3' }], childCategories: [] },
        { categoryId: 'c3', name: 'Xuất khẩu', parentCategoryId: 'cat-a', jobPostings: [], childCategories: [] },
      ],
    },
  ] as unknown as IJobCategoryDto[];

  it('keeps the full child and job counts while a query matches only one child', async () => {
    const user = userEvent.setup();
    render(<JobCategoryClient categories={busy} />);
    expect(screen.getByText('3 danh mục con')).toBeVisible();
    expect(screen.getByText('5 việc làm')).toBeVisible();

    await user.type(screen.getByRole('searchbox', { name: 'Tìm danh mục' }), 'xuất');

    expect(screen.getByText('Xuất khẩu')).toBeVisible();
    expect(screen.queryByText('Bán lẻ')).not.toBeInTheDocument();
    expect(screen.getByText('3 danh mục con')).toBeVisible();
    expect(screen.getByText('5 việc làm')).toBeVisible();
  });

  it('opens a collapsed root when only its child matches, and restores the collapse when the query clears', async () => {
    const user = userEvent.setup();
    render(<JobCategoryClient categories={busy} />);
    await user.click(screen.getByRole('button', { name: 'Thu gọn Kinh doanh' }));
    expect(screen.queryByText('Xuất khẩu')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Tìm danh mục' }), 'xuất');
    expect(screen.getByText('Xuất khẩu')).toBeVisible();

    await user.clear(screen.getByRole('searchbox', { name: 'Tìm danh mục' }));
    expect(screen.queryByText('Xuất khẩu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mở rộng Kinh doanh' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('JobCategoryClient — row menu', () => {
  it('opens the edit dialog with that category', async () => {
    const user = userEvent.setup();
    render(<JobCategoryClient categories={categories} />);

    await chooseFromRowMenu(user, 'Frontend', 'Chỉnh sửa');

    const dialog = await screen.findByRole('dialog', { name: 'Cập nhật danh mục' });
    expect(within(dialog).getByRole('textbox', { name: 'Tên danh mục' })).toHaveValue('Frontend');
  });

  it('deletes that category', async () => {
    vi.mocked(deleteJobCategoryAction).mockResolvedValue({ success: true, message: 'Đã xóa' });
    const user = userEvent.setup();
    render(<JobCategoryClient categories={categories} />);

    await chooseFromRowMenu(user, 'Nhân sự', 'Xóa');

    await waitFor(() => expect(deleteJobCategoryAction).toHaveBeenCalledWith('cat-hr'));
    expect(deleteJobCategoryAction).toHaveBeenCalledTimes(1);
  });
});

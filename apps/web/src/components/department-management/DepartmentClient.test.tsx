// Client-side list states only; the department list comes from getDepartmentsAction (departments.action.test.ts).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Department } from '@/types/interfaces/departments.interface';
import DepartmentClient from './DepartmentClient';

vi.mock('@/servers/departments/departments.action', () => ({
  createDepartmentAction: vi.fn(),
  updateDepartmentAction: vi.fn(),
  deleteDepartmentAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const departments: Department[] = [
  {
    departmentId: 'dep-a', organizationId: 'org-a', name: 'Kỹ thuật', description: 'Nhóm phát triển',
    color: '#0071E3', members: [], membersCount: 0, jobPostingsCount: 0,
  },
  {
    departmentId: 'dep-b', organizationId: 'org-a', name: 'Kinh doanh', description: 'Bán hàng và đối tác',
    color: '#34C759', members: [], membersCount: 0, jobPostingsCount: 0,
  },
];

const cardNames = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('DepartmentClient — empty and no-match states', () => {
  it('says there are no departments yet, with one "Thêm phòng ban" button', () => {
    render(<DepartmentClient departments={[]} organizations={[]} />);
    expect(screen.getByRole('heading', { name: 'Chưa có phòng ban' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Thêm phòng ban' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Thêm phòng ban đầu tiên' })).toBeVisible();
  });

  it('says no department matches a search, and "Xóa tìm kiếm" brings every card back', async () => {
    const user = userEvent.setup();
    render(<DepartmentClient departments={departments} organizations={[]} />);
    expect(cardNames()).toEqual(['Kỹ thuật', 'Kinh doanh']);

    await user.type(screen.getByRole('textbox', { name: 'Tìm phòng ban' }), 'không có phòng này');
    expect(screen.getByRole('heading', { name: 'Không có phòng ban khớp' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    expect(screen.getByRole('textbox', { name: 'Tìm phòng ban' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Tìm phòng ban' })).toHaveFocus();
    expect(cardNames()).toEqual(['Kỹ thuật', 'Kinh doanh']);
  });

  it('finds a department by its description', async () => {
    const user = userEvent.setup();
    render(<DepartmentClient departments={departments} organizations={[]} />);
    await user.type(screen.getByRole('textbox', { name: 'Tìm phòng ban' }), 'đối tác');
    expect(cardNames()).toEqual(['Kinh doanh']);
  });
});

// Client-side list states only; the recruiter list comes from getRecruitersAction.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import RecruiterClient from './RecruiterClient';

vi.mock('@/servers/recruiters/recruiters.action', () => ({
  createRecruiterAction: vi.fn(),
  updateRecruiterAction: vi.fn(),
  deleteRecruiterAction: vi.fn(),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const departments = [{ departmentId: 'dep-a', name: 'Kỹ thuật', color: '#0071E3' }];
const recruiters = [
  {
    recruiterId: 'rec-a', userId: 'user-a', position: 'Trưởng nhóm',
    department: { departmentId: 'dep-a', name: 'Kỹ thuật' },
    user: { fullName: 'Nguyễn Văn A', email: 'a@ats.test', role: 'recruiter', status: 'active' },
  },
  {
    recruiterId: 'rec-b', userId: 'user-b', position: 'Phỏng vấn viên',
    department: { departmentId: 'dep-a', name: 'Kỹ thuật' },
    user: { fullName: 'Trần Thị B', email: 'b@ats.test', role: 'recruiter', status: 'inactive' },
  },
] as unknown as IRecruiterDto[];

const cardNames = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('RecruiterClient — empty and no-match states', () => {
  it('says there are no recruiters yet, with one "Thêm nhà tuyển dụng" button (the e2e clicks it by exact name)', () => {
    render(<RecruiterClient recruiters={[]} departments={departments} users={[]} />);
    expect(screen.getByRole('heading', { name: 'Chưa có nhà tuyển dụng' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Thêm nhà tuyển dụng' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Thêm nhà tuyển dụng đầu tiên' })).toBeVisible();
  });

  it('says no recruiter matches a search, and "Xóa bộ lọc" brings every card back', async () => {
    const user = userEvent.setup();
    render(<RecruiterClient recruiters={recruiters} departments={departments} users={[]} />);
    expect(cardNames()).toEqual(['Nguyễn Văn A', 'Trần Thị B']);

    await user.type(screen.getByRole('textbox', { name: 'Tìm nhà tuyển dụng' }), 'không ai tên này');
    expect(screen.getByRole('heading', { name: 'Không có nhà tuyển dụng khớp' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(screen.getByRole('textbox', { name: 'Tìm nhà tuyển dụng' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: 'Tìm nhà tuyển dụng' })).toHaveFocus();
    expect(cardNames()).toEqual(['Nguyễn Văn A', 'Trần Thị B']);
  });

  it('finds a recruiter by position as well as by name', async () => {
    const user = userEvent.setup();
    render(<RecruiterClient recruiters={recruiters} departments={departments} users={[]} />);
    await user.type(screen.getByRole('textbox', { name: 'Tìm nhà tuyển dụng' }), 'phỏng vấn');
    expect(cardNames()).toEqual(['Trần Thị B']);
  });
});

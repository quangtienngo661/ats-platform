// The recruiter's own profile: only the position is editable, through the form's server action (mocked here).
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { updateMyRecruiterProfileAction } from '@/servers/recruiters/recruiters.action';
import RecruiterProfileClient from './RecruiterProfileClient';

vi.mock('@/servers/recruiters/recruiters.action', () => ({ updateMyRecruiterProfileAction: vi.fn() }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const update = vi.mocked(updateMyRecruiterProfileAction);
const recruiter = {
    recruiterId: 'rec-1',
    userId: 'user-1',
    position: 'Trưởng nhóm',
    department: { departmentId: 'dep-1', name: 'Kỹ thuật' },
    user: { fullName: 'Nguyễn Văn A', email: 'a@ats.test', role: 'recruiter', status: 'active' },
} as unknown as IRecruiterDto;

beforeEach(() => {
    update.mockReset();
    update.mockResolvedValue({ success: true, message: 'Cập nhật hồ sơ thành công', data: { ...recruiter, position: 'Giám đốc tuyển dụng' } });
});

describe('RecruiterProfileClient — position', () => {
    it('makes the position editable from "Chỉnh sửa" without submitting anything', async () => {
        const user = userEvent.setup();
        render(<RecruiterProfileClient recruiter={recruiter} />);
        expect(screen.queryByRole('textbox', { name: 'Chức danh hiển thị' })).toBeNull();

        await user.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));

        const field = screen.getByRole('textbox', { name: 'Chức danh hiển thị' });
        expect(field).toHaveValue('Trưởng nhóm');
        expect(field).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeInTheDocument();
        // A form action runs in a transition; give it the chance to start before checking it did not.
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(update).not.toHaveBeenCalled();
    });

    it('submits the typed position from "Lưu thay đổi" and shows it once saved', async () => {
        const user = userEvent.setup();
        render(<RecruiterProfileClient recruiter={recruiter} />);
        await user.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));
        const field = screen.getByRole('textbox', { name: 'Chức danh hiển thị' });
        await user.clear(field);
        await user.type(field, 'Giám đốc tuyển dụng');

        await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

        await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
        const formData = update.mock.calls[0][1] as FormData;
        expect(formData.get('position')).toBe('Giám đốc tuyển dụng');
        await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Chức danh hiển thị' })).toBeNull());
        expect(screen.getAllByText('Giám đốc tuyển dụng').length).toBeGreaterThan(0);
    });

    // jsdom computes no layout: the primary "Lưu thay đổi" is 44 px tall on phones, so "Hủy" beside it must be too.
    it('token contract: "Hủy" matches the 44 px mobile height of "Lưu thay đổi"', async () => {
        const user = userEvent.setup();
        render(<RecruiterProfileClient recruiter={recruiter} />);
        await user.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));

        for (const name of ['Hủy', 'Lưu thay đổi']) {
            expect(screen.getByRole('button', { name }).className.split(' ')).toContain('max-md:min-h-11');
        }
    });
});

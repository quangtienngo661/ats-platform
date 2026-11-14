// Behaviour: the profile shows the candidate's details and edits them in a sheet.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ICandidateDto } from '@/types/interfaces/candidate.interface';

vi.mock('@/servers/candidates/candidates.action', () => ({
  updateMyCandidateProfileAction: vi.fn(async () => ({ success: true, message: '' })),
}));

import { updateMyCandidateProfileAction } from '@/servers/candidates/candidates.action';
import ProfileClient from './ProfileClient';

const action = vi.mocked(updateMyCandidateProfileAction);

afterEach(() => {
  vi.useRealTimers();
});

const profile = {
  candidateId: 'c1',
  userId: 'u1',
  currentTitle: 'Frontend Developer',
  yearsOfExperience: 3,
  cvCount: 2,
  applicationCount: 4,
  profileData: { summary: 'Thích làm giao diện', location: 'TP. Hồ Chí Minh' },
  user: {
    fullName: 'Nguyễn Văn An',
    email: 'an@example.com',
    phoneNumber: '0901234567',
    status: 'active',
    createdAt: '2026-01-15T00:00:00.000Z',
  },
} as unknown as ICandidateDto;

describe('ProfileClient', () => {
  it('shows the name as the page heading with the email under it', () => {
    render(<ProfileClient profile={profile} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Nguyễn Văn An' })).toBeInTheDocument();
    expect(screen.getAllByText('an@example.com')).toHaveLength(2); // header and contact list
  });

  it('opens the edit sheet with the current name filled in', async () => {
    render(<ProfileClient profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sửa hồ sơ' }));
    const dialog = await screen.findByRole('dialog', { name: 'Sửa hồ sơ' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên')).toHaveValue('Nguyễn Văn An');
  });

  it('closes the sheet after a successful save', async () => {
    action.mockResolvedValueOnce({ success: true, message: '' });
    render(<ProfileClient profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sửa hồ sơ' }));
    await screen.findByRole('dialog', { name: 'Sửa hồ sơ' });
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sửa hồ sơ' })).toBeNull(), { timeout: 2000 });
  });

  it('shows the error and keeps the sheet open after a failed save', async () => {
    action.mockResolvedValueOnce({ success: false, message: 'Không lưu được hồ sơ. Thử lại.' });
    render(<ProfileClient profile={profile} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sửa hồ sơ' }));
    await screen.findByRole('dialog', { name: 'Sửa hồ sơ' });
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không lưu được hồ sơ. Thử lại.');
    expect(screen.getByRole('dialog', { name: 'Sửa hồ sơ' })).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { CandidatesFilters } from './CandidatesFilters';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const applications: IApplicationDto[] = Array.from({ length: 8 }, (_, index) => ({
  applicationId: `app-${index + 1}`,
  jobId: 'job-1',
  cvId: `cv-${index + 1}`,
  status: index === 7 ? 'applied' : 'interview',
  appliedAt: '2026-10-14T02:00:00.000Z',
  candidate: {
    candidateId: `candidate-${index + 1}`,
    userId: `user-${index + 1}`,
    user: {
      fullName: index === 6 ? 'Lê Thị Bình' : `Nguyễn Văn ${index + 1}`,
      email: `candidate-${index + 1}@ats.test`,
      status: 'active',
      createdAt: '2026-10-01T02:00:00.000Z',
    },
  },
  screening: null,
}));

describe('CandidatesFilters', () => {
  it('"Chọn tất cả" selects every visible row and clears them again', async () => {
    const user = userEvent.setup();
    render(<CandidatesFilters applications={applications} jobId="job-1" />);
    await user.click(screen.getByRole('button', { name: /^Phỏng vấn/ }));
    const search = screen.getByRole('textbox', { name: 'Tìm ứng viên' });
    await user.type(search, 'Nguyễn');

    const all = screen.getByRole('checkbox', { name: 'Chọn tất cả' });
    const header = screen.getAllByRole('row')[0];
    expect(within(header).getAllByRole('columnheader')[0]).toContainElement(all);
    expect(screen.queryByRole('checkbox', { name: 'Chọn Lê Thị Bình' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Chọn Nguyễn Văn 8' })).not.toBeInTheDocument();
    const visible = screen.getAllByRole('checkbox').filter(checkbox => checkbox !== all);
    expect(visible).toHaveLength(6);
    for (const checkbox of visible) expect(checkbox).not.toBeChecked();

    await user.click(all);
    expect(all).toBeChecked();
    for (const checkbox of visible) {
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeEnabled();
    }
    expect(screen.getByRole('button', { name: 'So sánh' })).toBeDisabled();
    expect(screen.getByText('Chọn tối đa 4 ứng viên để so sánh')).toBeVisible();

    await user.click(all);
    expect(all).not.toBeChecked();
    for (const checkbox of visible) expect(checkbox).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'So sánh' })).toBeDisabled();
    expect(screen.queryByText('Chọn tối đa 4 ứng viên để so sánh')).not.toBeInTheDocument();

    // Hidden rows were never selected: only the two individual toggles count.
    await user.click(visible[0]);
    expect(screen.getByRole('button', { name: 'So sánh' })).toBeDisabled();
    await user.click(visible[1]);
    expect(screen.getByRole('button', { name: 'So sánh' })).toBeEnabled();
    await user.click(visible[0]);
    expect(visible[0]).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'So sánh' })).toBeDisabled();
    await user.click(visible[1]);

    await user.clear(search);
    await user.click(screen.getByRole('button', { name: /^Tất cả/ }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(9);
    for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).not.toBeChecked();

    await user.type(search, 'không có ứng viên này');
    const emptyCell = screen.getByRole('cell', { name: 'Không tìm thấy ứng viên nào.' });
    expect(emptyCell).toHaveAttribute('colspan', '7');
  });
});

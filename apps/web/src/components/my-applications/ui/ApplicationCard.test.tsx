import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IApplicationCard } from '@/types/interfaces/application.interface';
import { ApplicationCard } from './ApplicationCard';

vi.mock('./WithdrawApplicationForm', () => ({ WithdrawApplicationForm: () => null }));

function renderCard(status: string, locationType?: string) {
  const application = {
    applicationId: 'app-1',
    status,
    jobTitle: 'Backend Engineer',
    departmentName: 'Kỹ thuật',
    appliedAt: '2026-09-20T02:00:00.000Z',
    locationType,
  } as IApplicationCard;
  return render(<ApplicationCard application={application} onWithdrawSuccess={vi.fn()} />);
}

describe('ApplicationCard — the way to the interview schedule', () => {
  it('links an application in the interview stage to the schedule page', () => {
    renderCard('interview');
    expect(screen.getByRole('link', { name: 'Xem lịch phỏng vấn' })).toHaveAttribute('href', '/my-interviews');
  });

  it.each(['applied', 'screening', 'rejected'])('shows no schedule link for a %s application', (status) => {
    renderCard(status);
    expect(screen.queryByRole('link', { name: 'Xem lịch phỏng vấn' })).toBeNull();
  });
});

describe('ApplicationCard — shared work-type labels and fallbacks', () => {
  it.each([
    ['onsite', 'Văn phòng'],
    ['remote', 'Remote'],
    ['hybrid', 'Hybrid'],
    ['unknown-location', 'unknown-location'],
  ])('shows %s as %s', (locationType, label) => {
    renderCard('applied', locationType);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('ApplicationCard — the way to the application timeline (D9)', () => {
  it.each(['applied', 'interview', 'rejected', 'cancelled'])('links a %s application to its page', (status) => {
    renderCard(status);
    expect(screen.getByRole('link', { name: 'Xem tiến trình' })).toHaveAttribute('href', '/my-applications/app-1');
  });
});

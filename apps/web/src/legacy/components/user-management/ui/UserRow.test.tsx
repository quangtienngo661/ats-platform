// Component labels only; real account organization binding is verified by action and E2E tests.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '@ats-platform/types';
import type { IUserResponseDto } from '@/types/interfaces/user.interface';
import { UserRow } from './UserRow';

const organizationAdmin = {
  userId: 'user-b', fullName: 'Quản trị B', email: 'admin-b@ats.test',
  role: UserRole.org_admin, status: UserStatus.active, organizationId: 'org-b',
  createdAt: '2026-09-29T00:00:00.000Z', recruiter: null,
} as unknown as IUserResponseDto;

describe('UserRow — organization label (A7)', () => {
  it('shows the organization-admin role together with the assigned organization', () => {
    render(<table><tbody><UserRow user={organizationAdmin} organizationName="Tổ chức B" onEdit={vi.fn()} onDelete={vi.fn()} /></tbody></table>);
    expect(screen.getByRole('row')).toHaveTextContent('Quản trị B');
    expect(screen.getByText('Quản trị tổ chức')).toBeVisible();
    expect(screen.getByText('Tổ chức: Tổ chức B')).toBeVisible();
    expect(screen.queryByText('Tổ chức: Tổ chức A')).not.toBeInTheDocument();
  });

  it('does not label a global candidate as belonging to an organization', () => {
    const candidate = { ...organizationAdmin, role: UserRole.candidate, organizationId: null };
    render(<table><tbody><UserRow user={candidate} onEdit={vi.fn()} onDelete={vi.fn()} /></tbody></table>);
    expect(screen.getByText('Ứng viên')).toBeVisible();
    expect(screen.queryByText(/^Tổ chức:/)).not.toBeInTheDocument();
  });
});

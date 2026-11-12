// Component labels only; the server list's organization scope is covered by E2E.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Department } from '@/types/interfaces/departments.interface';
import { DepartmentCard } from './DepartmentCard';

const department = {
  departmentId: 'department-a', organizationId: 'org-a', name: 'Kỹ thuật',
  description: 'Nhóm phát triển', color: '#0071E3', members: [],
  membersCount: 0, jobPostingsCount: 0,
} satisfies Department;

describe('DepartmentCard — organization label (A7)', () => {
  it('shows the provided organization name alongside a department', () => {
    render(<DepartmentCard department={department} organizationName="Tổ chức A" onEdit={vi.fn()} onDelete={vi.fn()} onViewDetail={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Kỹ thuật' })).toBeVisible();
    expect(screen.getByText('Tổ chức: Tổ chức A')).toBeVisible();
    expect(screen.queryByText('Tổ chức: Tổ chức B')).not.toBeInTheDocument();
  });

  it('does not invent an organization label when none is provided', () => {
    render(<DepartmentCard department={department} onEdit={vi.fn()} onDelete={vi.fn()} onViewDetail={vi.fn()} />);
    expect(screen.queryByText(/^Tổ chức:/)).not.toBeInTheDocument();
  });
});

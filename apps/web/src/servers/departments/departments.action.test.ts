// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { getDepartmentByIdAction, getDepartmentsAction } from './departments.action';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { get: mocks.get } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const department = (departmentId: string, organizationId: string) => ({
  departmentId, organizationId, name: 'Kỹ thuật', description: '', color: '#0071E3',
  recruiters: [], jobPostings: [],
});

describe('Department actions — preserve organization identity for list labels (A7)', () => {
  it('keeps different organization IDs on same-name departments', async () => {
    mocks.get.mockResolvedValue({ data: [department('department-a', 'org-a'), department('department-b', 'org-b')] });
    const results = await getDepartmentsAction();
    expect(results.map((row) => ({ departmentId: row.departmentId, organizationId: row.organizationId })))
      .toEqual([
        { departmentId: 'department-a', organizationId: 'org-a' },
        { departmentId: 'department-b', organizationId: 'org-b' },
      ]);
  });

  it('keeps the organization ID when fetching one department', async () => {
    mocks.get.mockResolvedValue({ data: department('department-b', 'org-b') });
    const result = await getDepartmentByIdAction('department-b');
    expect(result).toHaveProperty('organizationId', 'org-b');
    expect(mocks.get).toHaveBeenCalledWith('/departments/department-b');
  });
});

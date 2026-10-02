// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createJobPostingAction } from './job-postings.action';

const mocks = vi.hoisted(() => ({ post: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { post: mocks.post } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: vi.fn() }) }));

const jobFormFor = (createdBy: string) => {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    departmentId: 'department-a', title: 'Backend developer', locationType: 'remote', createdBy,
  })) form.set(name, value);
  return form;
};

describe('createJobPostingAction — owner selected by organization admin (A5)', () => {
  beforeEach(() => {
    mocks.post.mockResolvedValue({ data: { jobId: 'job-a' } });
  });

  it('forwards the selected recruiter owner alongside the selected department', async () => {
    const result = await createJobPostingAction({ success: false, message: '' }, jobFormFor('recruiter-a'));
    expect(result.success).toBe(true);
    expect(mocks.post).toHaveBeenCalledWith('/job-postings', {
      departmentId: 'department-a', title: 'Backend developer', locationType: 'remote',
      createdBy: 'recruiter-a',
    });
  });

  it('trims the submitted owner ID', async () => {
    await createJobPostingAction({ success: false, message: '' }, jobFormFor(' recruiter-a '));
    expect(mocks.post.mock.calls[0][1]).toHaveProperty('createdBy', 'recruiter-a');
  });

  it.each(['', '   '])('omits an empty owner %j for the existing self-owned recruiter flow', async (createdBy) => {
    await createJobPostingAction({ success: false, message: '' }, jobFormFor(createdBy));
    expect(mocks.post.mock.calls[0][1]).not.toHaveProperty('createdBy');
  });
});

// @vitest-environment node
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createJobPostingAction,
  getJobFilterOptionsAction,
  getJobPostingsAction,
  getJobPostingByIdAction,
} from './job-postings.action';

const mocks = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/http', () => ({ default: { post: mocks.post, get: mocks.get } }));
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

describe('job list reads and filters', () => {
  it('forwards location type, publication filter and pagination to the API', async () => {
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { total: 0, page: 2, limit: 12, totalPages: 0 } } });
    await getJobPostingsAction({ locationType: 'remote', status: 'active', page: 2, limit: 12 });
    expect(mocks.get).toHaveBeenCalledWith('/job-postings', {
      params: { locationType: 'remote', status: 'active', page: 2, limit: 12 },
      paramsSerializer: { indexes: null },
    });
  });
  it('sends the salary range, 0 included, and the skills', async () => {
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } } });
    await getJobPostingsAction({ salaryMin: 0, salaryMax: 15_000_000, skillIds: ['skill-a', 'skill-b'] });
    const [, config] = mocks.get.mock.calls[0];
    expect(config.params).toEqual({ salaryMin: 0, salaryMax: 15_000_000, skillIds: ['skill-a', 'skill-b'] });
  });
  it('leaves out a salary or skill filter that is not set', async () => {
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } } });
    await getJobPostingsAction({ search: 'react', skillIds: [] });
    expect(mocks.get.mock.calls[0][1].params).toEqual({ search: 'react' });
  });
  it('sends skills as repeated keys: the API refuses the skillIds[] form', async () => {
    mocks.get.mockResolvedValue({ data: { items: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } } });
    await getJobPostingsAction({ salaryMin: 12_000_000, skillIds: ['skill-a', 'skill-b'] });
    const [url, config] = mocks.get.mock.calls[0];
    // Control: without the serializer axios writes the bracket form the API rejects.
    expect(decodeURIComponent(axios.getUri({ url, params: config.params }))).toContain('skillIds[]=skill-a');
    expect(axios.getUri({ url, params: config.params, paramsSerializer: config.paramsSerializer })).toBe(
      '/job-postings?salaryMin=12000000&skillIds=skill-a&skillIds=skill-b',
    );
  });
  it('distinguishes API failure from a successful empty list', async () => {
    mocks.get.mockRejectedValue(new Error('offline'));
    await expect(getJobPostingsAction()).rejects.toThrow('Không thể tải dữ liệu');
  });
  it('reads the skills the public job board can be filtered by', async () => {
    mocks.get.mockResolvedValue({ data: { skills: [{ skillId: 'skill-a', name: 'NestJS' }] } });
    await expect(getJobFilterOptionsAction()).resolves.toEqual({ skills: [{ skillId: 'skill-a', name: 'NestJS' }] });
    expect(mocks.get).toHaveBeenCalledWith('/job-postings/filter-options');
  });
  it('still lets the job board load when the filter options cannot be read', async () => {
    mocks.get.mockRejectedValue(new Error('offline'));
    await expect(getJobFilterOptionsAction()).resolves.toEqual({ skills: [] });
  });
  it('does not swallow a redirect of the session while reading the filter options', async () => {
    // Control for the case above: a Next.js control-flow error must keep propagating.
    mocks.get.mockRejectedValue(Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/sign-in;307;' }));
    await expect(getJobFilterOptionsAction()).rejects.toThrow('NEXT_REDIRECT');
  });
  it('returns missing detail only for a genuine 404', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } });
    await expect(getJobPostingByIdAction('missing')).resolves.toBeNull();
    mocks.get.mockRejectedValue({ response: { status: 500 } });
    await expect(getJobPostingByIdAction('unavailable')).rejects.toThrow('Không thể tải dữ liệu');
  });
});

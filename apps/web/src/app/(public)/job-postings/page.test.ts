// The job search page: what it asks the API for, and what it hands the client,
// whatever the URL carries (RF3, RF5).
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getJobFilterOptionsAction, getJobPostingsAction } from '@/servers/job-postings/job-postings.action';
import JobsPage from './page';

vi.mock('@/servers/job-postings/job-postings.action', () => ({
  getJobPostingsAction: vi.fn(),
  getJobFilterOptionsAction: vi.fn(),
}));
vi.mock('@/servers/job-categories/job-categories.action', () => ({ getViewerJobCategoriesAction: vi.fn(async () => []) }));
vi.mock('@/components/public/layout/PublicFooter', () => ({ PublicFooter: () => null }));
vi.mock('@/components/public/jobs/JobSearchClient', () => ({ JobSearchClient: () => null }));

const fetchJobs = vi.mocked(getJobPostingsAction);
const skills = [{ skillId: 'skill-a', name: 'NestJS' }];

beforeEach(() => {
  fetchJobs.mockResolvedValue({ items: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } });
  vi.mocked(getJobFilterOptionsAction).mockResolvedValue({ skills });
});

type ClientProps = { initialQuery: Record<string, unknown>; skills: unknown };

async function renderPage(searchParams: Record<string, string | string[]> = {}) {
  const tree = (await JobsPage({ searchParams: Promise.resolve(searchParams) })) as unknown as {
    props: { children: { props: ClientProps }[] };
  };
  return { client: tree.props.children[0].props, query: fetchJobs.mock.calls[0][0] ?? {} };
}

describe('JobsPage filters', () => {
  it('asks for the salary range and skills in the URL and hands them to the client', async () => {
    const id = randomUUID();
    const { client, query } = await renderPage({ salaryMin: '12000000', salaryMax: '16000000', skillIds: id });

    expect(query).toMatchObject({ status: 'active', salaryMin: 12_000_000, salaryMax: 16_000_000, skillIds: [id] });
    expect(client.initialQuery).toMatchObject({ salaryMin: 12_000_000, salaryMax: 16_000_000, skillIds: [id] });
    expect(client.skills).toEqual(skills);
  });

  it('reads a repeated skillIds key as a list', async () => {
    const ids = [randomUUID(), randomUUID()];
    expect((await renderPage({ skillIds: ids })).query.skillIds).toEqual(ids);
  });

  it.each([
    ['an empty salary', { salaryMin: '' }],
    ['a salary that is not a number', { salaryMin: 'abc' }],
    ['a skill that is not a UUID', { skillIds: 'khong-phai-uuid' }],
    ['a minimum above the maximum', { salaryMin: '20000000', salaryMax: '10000000' }],
  ])('still loads the page with %s, ignoring it', async (_case, searchParams) => {
    const { query } = await renderPage(searchParams);

    expect(query).not.toHaveProperty('salaryMin');
    expect(query).not.toHaveProperty('salaryMax');
    expect(query).not.toHaveProperty('skillIds');
  });

  it('passes on no more than 20 skills', async () => {
    const ids = Array.from({ length: 21 }, () => randomUUID());
    expect((await renderPage({ skillIds: ids })).query.skillIds).toHaveLength(20);
  });
});

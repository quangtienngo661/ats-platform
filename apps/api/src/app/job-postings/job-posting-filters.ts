import { Prisma } from '@ats-platform/database';

/**
 * Where-conditions for the salary and skill filters of the job board, to be joined
 * with AND. A posting with only one end of a salary counts as that single value, so
 * its top pay is `salaryMax ?? salaryMin` and its bottom pay `salaryMin ?? salaryMax`;
 * a posting with no salary matches neither comparison and is left out (R4). Whether
 * that NULL handling holds can only be shown on a real PostgreSQL, not on a mock.
 */
export function jobPostingFilters(query: {
  salaryMin?: number;
  salaryMax?: number;
  skillIds?: string[];
}): Prisma.JobPostingWhereInput[] {
  const { salaryMin, salaryMax, skillIds } = query;
  const filters: Prisma.JobPostingWhereInput[] = [];

  if (salaryMin !== undefined) {
    filters.push({
      OR: [
        { salaryMax: { gte: salaryMin } },
        { salaryMax: null, salaryMin: { gte: salaryMin } },
      ],
    });
  }
  if (salaryMax !== undefined) {
    filters.push({
      OR: [
        { salaryMin: { lte: salaryMax } },
        { salaryMin: null, salaryMax: { lte: salaryMax } },
      ],
    });
  }
  if (skillIds?.length) {
    filters.push({ jobPostingSkills: { some: { skillId: { in: skillIds } } } });
  }
  return filters;
}

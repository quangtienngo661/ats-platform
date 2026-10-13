import type { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

/** A public job posting as the API sends it: its skills arrive as `jobPostingSkills[].skill`. */
export function jobPosting(skillNames: string[] = []): IJobPostingDto {
  return {
    jobId: 'job-1',
    title: 'Backend Engineer',
    locationType: 'remote',
    salaryMin: 15_000_000,
    salaryMax: 25_000_000,
    jobPostingSkills: skillNames.map((name, index) => ({
      id: `link-${index}`,
      isRequired: true,
      skill: { skillId: `skill-${index}`, name },
    })),
  } as unknown as IJobPostingDto;
}

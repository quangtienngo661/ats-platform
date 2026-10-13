import type { IJobPostingDto } from '@/types/interfaces/job-posting.interface';

/** The skills of a posting as the API sends them: `jobPostingSkills[].skill`. */
export function jobSkillsOf(job: Pick<IJobPostingDto, 'jobPostingSkills'>): { skillId: string; name: string }[] {
    return (job.jobPostingSkills ?? []).map(({ skill }) => ({ skillId: skill.skillId, name: skill.name }));
}

import { JobPostingSkillsService } from './job-posting-skills.service';
import { createPrismaMock } from '../../../test-utils/unit-test-helpers';

describe('JobPostingSkillsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: JobPostingSkillsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new JobPostingSkillsService(prisma as any);
  });

  it('creates many job-skill rows', async () => {
    prisma.jobPostingSkill.createMany.mockResolvedValue({ count: 2 });

    await service.create('job-1', [
      { skillId: 'skill-1', isRequired: true },
      { skillId: 'skill-2', isRequired: false },
    ] as any);

    expect(prisma.jobPostingSkill.createMany).toHaveBeenCalledWith({
      data: [
        { jobId: 'job-1', skillId: 'skill-1', isRequired: true },
        { jobId: 'job-1', skillId: 'skill-2', isRequired: false },
      ],
    });
  });

  it('uses the provided transaction client', async () => {
    const tx = createPrismaMock();
    tx.jobPostingSkill.deleteMany.mockResolvedValue({ count: 1 });

    await service.deleteByJobId('job-1', tx as any);

    expect(tx.jobPostingSkill.deleteMany).toHaveBeenCalledWith({ where: { jobId: 'job-1' } });
    expect(prisma.jobPostingSkill.deleteMany).not.toHaveBeenCalled();
  });
});

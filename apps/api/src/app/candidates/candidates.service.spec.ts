import { CandidatesService } from './candidates.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CandidatesService(prisma as any);
  });

  it('returns a compact candidate profile', async () => {
    prisma.candidate.findUnique.mockResolvedValue({
      candidateId: 'cand-1',
      user: { userId: 'user-1' },
      currentTitle: 'Backend',
      yearsOfExperience: 2,
      profileData: { skills: ['node'] },
      _count: { cvs: 2, applications: 3 },
    });

    await expect(service.getProfile('user-1')).resolves.toEqual({
      candidateId: 'cand-1',
      user: { userId: 'user-1' },
      currentTitle: 'Backend',
      yearsOfExperience: 2,
      profileData: { skills: ['node'] },
      cvCount: 2,
      applicationCount: 3,
    });
  });

  it('merges profile data and nested user info on update', async () => {
    prisma.candidate.findUnique.mockResolvedValueOnce({ profileData: { summary: 'old', skills: ['node'] } });
    prisma.candidate.update.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.candidate.findUnique.mockResolvedValueOnce({
      candidateId: 'cand-1',
      user: { fullName: 'Alice' },
      currentTitle: 'Senior',
      yearsOfExperience: 4,
      profileData: { summary: 'new', skills: ['node'] },
      _count: { cvs: 0, applications: 0 },
    });

    await service.updateProfile('user-1', {
      currentTitle: 'Senior',
      profileData: { summary: 'new' },
      userInfo: { fullName: 'Alice' },
    });

    expect(prisma.candidate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({
          profileData: { summary: 'new', skills: ['node'] },
          user: { update: { fullName: 'Alice' } },
        }),
      }),
    );
  });

  it('throws when candidate profile is missing', async () => {
    prisma.candidate.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('missing')).rejects.toThrow('Kh');
  });

  it('builds paginated candidate search filters', async () => {
    prisma.candidate.findMany.mockResolvedValue([
      { candidateId: 'cand-1', user: { email: 'a@test.com' }, _count: { cvs: 1, applications: 0 } },
    ]);
    prisma.candidate.count.mockResolvedValue(1);

    await service.findAll({ search: 'alice', status: 'active' as any, page: 2, limit: 5 });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.candidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        where: expect.objectContaining({
          OR: expect.any(Array),
          user: { status: 'active' },
        }),
      }),
    );
  });
});

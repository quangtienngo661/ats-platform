import { RecruitersService } from './recruiters.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('RecruitersService', () => {
  let service: RecruitersService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RecruitersService(prisma as any);
  });

  it('creates a recruiter after validating user, department, and uniqueness', async () => {
    prisma.user.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.department.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
    prisma.recruiter.findUnique.mockResolvedValue(null);
    prisma.recruiter.create.mockResolvedValue({ recruiterId: 'rec-1' });

    await service.create({ userId: 'user-1', departmentId: 'dep-1', position: 'HR' });

    expect(prisma.recruiter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: 'user-1', departmentId: 'dep-1', position: 'HR' },
      }),
    );
  });

  it('rejects missing user, missing department, and duplicate profile', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.create({ userId: 'missing', departmentId: 'dep-1', position: 'HR' })).rejects.toThrow('d');

    prisma.user.findUnique.mockResolvedValue({ userId: 'user-1' });
    prisma.department.findUnique.mockResolvedValue(null);
    await expect(service.create({ userId: 'user-1', departmentId: 'missing', position: 'HR' })).rejects.toThrow('ph');

    prisma.department.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
    prisma.recruiter.findUnique.mockResolvedValue({ recruiterId: 'rec-1' });
    await expect(service.create({ userId: 'user-1', departmentId: 'dep-1', position: 'HR' })).rejects.toThrow('t');
  });

  it('gets and updates the current recruiter profile by user id', async () => {
    prisma.recruiter.findUnique.mockResolvedValue({ recruiterId: 'rec-1' });
    prisma.recruiter.update.mockResolvedValue({ recruiterId: 'rec-1', position: 'Lead' });

    await expect(service.getMe('user-1')).resolves.toEqual({ recruiterId: 'rec-1' });
    await expect(service.updateMe('user-1', { position: 'Lead' })).resolves.toEqual({
      recruiterId: 'rec-1',
      position: 'Lead',
    });
  });

  it('throws for missing recruiter on update/remove', async () => {
    prisma.recruiter.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { position: 'HR' })).rejects.toThrow('Kh');
    await expect(service.remove('missing')).rejects.toThrow('Kh');
  });
});

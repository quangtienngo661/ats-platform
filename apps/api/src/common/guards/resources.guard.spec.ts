import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@ats-platform/database';
import { OwnershipGuard } from './resources.guard';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

type User = { userId: string; role: UserRole; organizationId: string | null };

const user = (
  role: UserRole,
  organizationId: string | null = 'org-1',
): User => ({
  userId: 'user-1',
  role,
  organizationId,
});

describe('OwnershipGuard — organization boundary', () => {
  let prisma: ReturnType<typeof createPrismaMock>;

  const guardFor = (resource: string) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(resource),
    };
    return new OwnershipGuard(reflector as unknown as Reflector, prisma as any);
  };
  const contextFor = (caller: User, id = 'res-1') =>
    ({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: caller, params: { id } }),
      }),
    }) as any;

  beforeEach(() => {
    prisma = createPrismaMock();
  });

  describe('job-posting', () => {
    const posting = (organizationId: string, ownerUserId: string) => ({
      organizationId,
      recruiter: { userId: ownerUserId },
    });

    it('lets an org_admin manage any posting in its organization', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(
        posting('org-1', 'someone-else'),
      );

      await expect(
        guardFor('job-posting').canActivate(
          contextFor(user(UserRole.org_admin)),
        ),
      ).resolves.toBe(true);
    });

    it('refuses an org_admin a posting of another organization', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(
        posting('org-2', 'someone-else'),
      );

      await expect(
        guardFor('job-posting').canActivate(
          contextFor(user(UserRole.org_admin)),
        ),
      ).rejects.toThrow('tổ chức khác');
    });

    it('lets the owning recruiter in, inside its organization', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(
        posting('org-1', 'user-1'),
      );

      await expect(
        guardFor('job-posting').canActivate(
          contextFor(user(UserRole.recruiter)),
        ),
      ).resolves.toBe(true);
    });

    // Owning is not enough: a recruiter moved to another organization would
    // otherwise keep editing the postings it left behind.
    it('refuses the owning recruiter once the posting is in another organization', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(
        posting('org-2', 'user-1'),
      );

      await expect(
        guardFor('job-posting').canActivate(
          contextFor(user(UserRole.recruiter)),
        ),
      ).rejects.toThrow('tổ chức khác');
    });

    it('still refuses a recruiter that does not own the posting', async () => {
      prisma.jobPosting.findUnique.mockResolvedValue(
        posting('org-1', 'someone-else'),
      );

      await expect(
        guardFor('job-posting').canActivate(
          contextFor(user(UserRole.recruiter)),
        ),
      ).rejects.toThrow('chủ sở hữu');
    });

    it('lets the platform admin in without reading the posting', async () => {
      await expect(
        guardFor('job-posting').canActivate(
          contextFor(user(UserRole.admin, null)),
        ),
      ).resolves.toBe(true);
      expect(prisma.jobPosting.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('application', () => {
    const application = (organizationId: string) => ({
      organizationId,
      candidate: { userId: 'cand-user' },
      jobPosting: { departmentId: 'dep-1' },
    });

    it("lets an org_admin read any department's application in its organization", async () => {
      prisma.application.findUnique.mockResolvedValue(application('org-1'));

      await expect(
        guardFor('application').canActivate(
          contextFor(user(UserRole.org_admin)),
        ),
      ).resolves.toBe(true);
      expect(prisma.recruiter.findUnique).not.toHaveBeenCalled();
    });

    it.each([UserRole.org_admin, UserRole.recruiter])(
      'refuses a %s an application of another organization',
      async (role) => {
        prisma.application.findUnique.mockResolvedValue(application('org-2'));

        await expect(
          guardFor('application').canActivate(contextFor(user(role))),
        ).rejects.toBeInstanceOf(ForbiddenException);
      },
    );

    it('still lets the owning candidate in, whatever the organization', async () => {
      prisma.application.findUnique.mockResolvedValue({
        ...application('org-2'),
        candidate: { userId: 'user-1' },
      });

      await expect(
        guardFor('application').canActivate(
          contextFor(user(UserRole.candidate, null)),
        ),
      ).resolves.toBe(true);
    });
  });

  describe('cv — a shared-pool resource', () => {
    const cv = (...applicationOrganizations: string[]) => ({
      candidate: { userId: 'cand-user' },
      applications: applicationOrganizations.map((organizationId) => ({
        organizationId,
        jobPosting: { departmentId: 'dep-1' },
      })),
    });

    it('lets an org_admin see a CV that backs an application in its organization', async () => {
      prisma.cV.findUnique.mockResolvedValue(cv('org-2', 'org-1'));

      await expect(
        guardFor('cv').canActivate(contextFor(user(UserRole.org_admin))),
      ).resolves.toBe(true);
    });

    it("refuses an org_admin a CV that only backs other organizations' applications", async () => {
      prisma.cV.findUnique.mockResolvedValue(cv('org-2'));

      await expect(
        guardFor('cv').canActivate(contextFor(user(UserRole.org_admin))),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('refuses an org_admin with no organization (E2)', async () => {
      prisma.cV.findUnique.mockResolvedValue(cv('org-1'));

      await expect(
        guardFor('cv').canActivate(contextFor(user(UserRole.org_admin, null))),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});

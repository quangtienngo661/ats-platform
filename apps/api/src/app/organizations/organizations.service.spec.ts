import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import { OrganizationsService } from './organizations.service';
import {
  callerOf,
  createPrismaMock,
  createPrismaTransactionMock,
} from '../../test-utils/unit-test-helpers';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let tx: ReturnType<typeof createPrismaTransactionMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    tx = createPrismaTransactionMock();
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));
    service = new OrganizationsService(prisma as any);
  });

  describe('create', () => {
    beforeEach(() => {
      tx.organization.create.mockResolvedValue({ organizationId: 'org-2' });
      tx.organization.findUniqueOrThrow.mockResolvedValue({
        organizationId: 'org-2',
        name: 'Beta',
        slug: 'beta-tech',
      });
    });

    it('creates the organization with a trimmed name', async () => {
      await service.create({ name: '  Beta  ', slug: 'beta-tech' });

      expect(tx.organization.create).toHaveBeenCalledWith({
        data: { name: 'Beta', slug: 'beta-tech' },
      });
    });

    // Screening falls back to an organization's default config — an organization
    // created without one could not screen a single CV.
    it('gives the new organization its own default screening config, in the same transaction', async () => {
      await service.create({ name: 'Beta', slug: 'beta-tech' });

      expect(tx.aiConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-2',
          isDefault: true,
          skillsWeight: 0.5,
          experienceWeight: 0.3,
          educationWeight: 0.2,
        }),
      });
      // …and not through the non-transactional client.
      expect(prisma.aiConfig.create).not.toHaveBeenCalled();
    });

    it('returns the organization summary', async () => {
      await expect(
        service.create({ name: 'Beta', slug: 'beta-tech' }),
      ).resolves.toEqual({
        organizationId: 'org-2',
        name: 'Beta',
        slug: 'beta-tech',
      });
    });

    it('reports a taken slug as a conflict', async () => {
      tx.organization.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.create({ name: 'Dup', slug: 'ats-demo' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lets any other failure through untouched', async () => {
      const outage = new Error('connection reset');
      tx.organization.create.mockRejectedValue(outage);

      await expect(
        service.create({ name: 'Beta', slug: 'beta-tech' }),
      ).rejects.toBe(outage);
    });
  });

  it('404s an organization that does not exist', async () => {
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(service.findOne('org-ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('findMine', () => {
    it("returns the caller's own organization", async () => {
      prisma.organization.findUnique.mockResolvedValue({
        organizationId: 'org-1',
      });

      await expect(
        service.findMine(callerOf(UserRole.org_admin)),
      ).resolves.toEqual({
        organizationId: 'org-1',
      });
      expect(prisma.organization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1' } }),
      );
    });

    it('refuses a caller with no organization', async () => {
      await expect(
        service.findMine(
          callerOf(UserRole.recruiter, { organizationId: null }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.organization.findUnique).not.toHaveBeenCalled();
    });
  });
});

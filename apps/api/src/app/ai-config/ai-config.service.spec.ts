import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import { AiConfigService } from './ai-config.service';
import {
  callerOf,
  createPrismaMock,
  createPrismaTransactionMock,
} from '../../test-utils/unit-test-helpers';

const validConfig = {
  name: 'default',
  isDefault: true,
  skillsWeight: 0.5,
  experienceWeight: 0.3,
  educationWeight: 0.2,
  minimumScoreThreshold: 60,
};

describe('AiConfigService', () => {
  let service: AiConfigService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let tx: ReturnType<typeof createPrismaTransactionMock>;

  const orgAdmin = callerOf(UserRole.org_admin); // organization 'org-1'
  const platformAdmin = callerOf(UserRole.admin);

  beforeEach(() => {
    prisma = createPrismaMock();
    tx = createPrismaTransactionMock();
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));
    service = new AiConfigService(prisma as any);
  });

  it('rejects configs whose weights do not sum to 1', async () => {
    await expect(
      service.create({ ...validConfig, experienceWeight: 0.4 }, orgAdmin),
    ).rejects.toThrow('1.0');
  });

  describe('create — criterion 5, configs belong to one organization', () => {
    it('creates an org_admin\'s config in its own organization', async () => {
      tx.aiConfig.create.mockResolvedValue({ configId: 'cfg-1' });

      await service.create(validConfig, orgAdmin);

      expect(tx.aiConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ organizationId: 'org-1', name: 'default' }),
      });
    });

    // The defect this closes: unsetting the previous default used to run over the
    // whole table, so one organization choosing a default removed everyone else's.
    it('unsets the previous default of THAT organization only', async () => {
      tx.aiConfig.create.mockResolvedValue({ configId: 'cfg-1' });

      await service.create(validConfig, orgAdmin);

      expect(tx.aiConfig.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', isDefault: true },
        data: { isDefault: false },
      });
    });

    it('refuses an org_admin naming another organization, writing nothing', async () => {
      await expect(
        service.create({ ...validConfig, organizationId: 'org-2' }, orgAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('requires a platform admin to name the organization', async () => {
      await expect(service.create(validConfig, platformAdmin)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('404s a platform admin naming an organization that does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ ...validConfig, organizationId: 'org-ghost' }, platformAdmin),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates a platform admin\'s config in the organization it names', async () => {
      prisma.organization.findUnique.mockResolvedValue({ organizationId: 'org-2' });
      tx.aiConfig.create.mockResolvedValue({ configId: 'cfg-9' });

      await service.create({ ...validConfig, organizationId: 'org-2' }, platformAdmin);

      expect(tx.aiConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ organizationId: 'org-2' }),
      });
    });
  });

  describe('reads are scoped to the caller', () => {
    it('lists only the org_admin\'s organization', async () => {
      prisma.aiConfig.findMany.mockResolvedValue([]);

      await service.findAll(orgAdmin);

      expect(prisma.aiConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-1' } }),
      );
    });

    it('lists every organization for a platform admin (criterion 6a)', async () => {
      prisma.aiConfig.findMany.mockResolvedValue([]);

      await service.findAll(platformAdmin);

      expect(prisma.aiConfig.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('reports another organization\'s config as not found', async () => {
      prisma.aiConfig.findFirst.mockResolvedValue(null);

      await expect(service.findOne('cfg-of-org-2', orgAdmin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.aiConfig.findFirst).toHaveBeenCalledWith({
        where: { configId: 'cfg-of-org-2', organizationId: 'org-1' },
      });
    });
  });

  it('updates using existing weights for omitted fields', async () => {
    prisma.aiConfig.findFirst.mockResolvedValue({
      configId: 'cfg-1',
      organizationId: 'org-1',
      skillsWeight: 0.5,
      experienceWeight: 0.3,
      educationWeight: 0.2,
    });
    tx.aiConfig.update.mockResolvedValue({ configId: 'cfg-1' });

    await service.update('cfg-1', { name: 'updated' }, orgAdmin);

    expect(tx.aiConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { configId: 'cfg-1' },
        data: expect.objectContaining({ name: 'updated' }),
      }),
    );
  });

  it('blocks deletion of default or in-use configs', async () => {
    prisma.aiConfig.findFirst.mockResolvedValueOnce({ configId: 'cfg-1', isDefault: true });
    await expect(service.remove('cfg-1', orgAdmin)).rejects.toThrow('mặc định');

    prisma.aiConfig.findFirst.mockResolvedValueOnce({ configId: 'cfg-2', isDefault: false });
    prisma.cVScreening.count.mockResolvedValueOnce(2);
    await expect(service.remove('cfg-2', orgAdmin)).rejects.toThrow('đang được dùng');
  });

  it('sets exactly one default within the config\'s own organization', async () => {
    prisma.aiConfig.findFirst.mockResolvedValue({ configId: 'cfg-1', organizationId: 'org-1' });
    tx.aiConfig.update.mockResolvedValue({ configId: 'cfg-1', isDefault: true });

    await expect(service.setDefault('cfg-1', orgAdmin)).resolves.toEqual({
      configId: 'cfg-1',
      isDefault: true,
    });

    expect(tx.aiConfig.updateMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', isDefault: true, configId: { not: 'cfg-1' } },
      data: { isDefault: false },
    });
  });
});

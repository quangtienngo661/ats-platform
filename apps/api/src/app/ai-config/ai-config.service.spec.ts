import { AiConfigService } from './ai-config.service';
import { createPrismaMock, createPrismaTransactionMock } from '../../test-utils/unit-test-helpers';

describe('AiConfigService', () => {
  let service: AiConfigService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AiConfigService(prisma as any);
  });

  it('rejects configs whose weights do not sum to 1', async () => {
    await expect(
      service.create({
        name: 'bad',
        skillsWeight: 0.5,
        experienceWeight: 0.4,
        educationWeight: 0.2,
        minimumScoreThreshold: 60,
      } as any),
    ).rejects.toThrow('1.0');
  });

  it('unsets the previous default before creating a new default', async () => {
    const tx = createPrismaTransactionMock();
    tx.aiConfig.create.mockResolvedValue({ configId: 'cfg-1', isDefault: true });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.create({
      name: 'default',
      isDefault: true,
      skillsWeight: 0.5,
      experienceWeight: 0.3,
      educationWeight: 0.2,
      minimumScoreThreshold: 60,
    });

    expect(tx.aiConfig.updateMany).toHaveBeenCalledWith({
      where: { isDefault: true },
      data: { isDefault: false },
    });
    expect(tx.aiConfig.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'default', isDefault: true }),
      }),
    );
  });

  it('updates using existing weights for omitted fields', async () => {
    const tx = createPrismaTransactionMock();
    prisma.aiConfig.findUnique.mockResolvedValue({
      configId: 'cfg-1',
      skillsWeight: 0.5,
      experienceWeight: 0.3,
      educationWeight: 0.2,
    });
    tx.aiConfig.update.mockResolvedValue({ configId: 'cfg-1' });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await service.update('cfg-1', { name: 'updated' });

    expect(tx.aiConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { configId: 'cfg-1' },
        data: expect.objectContaining({ name: 'updated' }),
      }),
    );
  });

  it('blocks deletion of default or in-use configs', async () => {
    prisma.aiConfig.findUnique.mockResolvedValueOnce({ configId: 'cfg-1', isDefault: true });
    await expect(service.remove('cfg-1')).rejects.toThrow('m');

    prisma.aiConfig.findUnique.mockResolvedValueOnce({ configId: 'cfg-2', isDefault: false });
    prisma.cVScreening.count.mockResolvedValueOnce(2);
    await expect(service.remove('cfg-2')).rejects.toThrow('d');
  });

  it('sets exactly one default config', async () => {
    const tx = createPrismaTransactionMock();
    prisma.aiConfig.findUnique.mockResolvedValue({ configId: 'cfg-1' });
    tx.aiConfig.update.mockResolvedValue({ configId: 'cfg-1', isDefault: true });
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));

    await expect(service.setDefault('cfg-1')).resolves.toEqual({ configId: 'cfg-1', isDefault: true });

    expect(tx.aiConfig.updateMany).toHaveBeenCalledWith({
      where: { isDefault: true, configId: { not: 'cfg-1' } },
      data: { isDefault: false },
    });
  });
});

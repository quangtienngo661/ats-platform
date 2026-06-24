import { SkillsService } from './skills.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('SkillsService', () => {
  let service: SkillsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SkillsService(prisma as any);
  });

  it('creates a skill when name/category is unique', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);
    prisma.skill.create.mockResolvedValue({ skillId: 'skill-1', name: 'NestJS' });

    await service.create({ name: 'NestJS', category: 'Backend' });

    expect(prisma.skill.findUnique).toHaveBeenCalledWith({
      where: { name: 'NestJS', category: 'Backend' },
    });
    expect(prisma.skill.create).toHaveBeenCalledWith({
      data: { name: 'NestJS', category: 'Backend' },
    });
  });

  it('rejects duplicate skills', async () => {
    prisma.skill.findUnique.mockResolvedValue({ skillId: 'skill-1' });

    await expect(service.create({ name: 'NestJS', category: 'Backend' })).rejects.toThrow('t');
  });

  it('builds search filters only for provided values', async () => {
    prisma.skill.findMany.mockResolvedValue([]);

    await service.search('nest', 'back');

    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      where: {
        name: { contains: 'nest', mode: 'insensitive' },
        category: { contains: 'back', mode: 'insensitive' },
      },
    });
  });

  it('throws when updating a missing skill', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);

    await expect(service.update('missing', { name: 'React' })).rejects.toThrow('Kh');
  });

  it('deletes an existing skill', async () => {
    prisma.skill.findUnique.mockResolvedValue({ skillId: 'skill-1' });
    prisma.skill.delete.mockResolvedValue({ skillId: 'skill-1' });

    await expect(service.remove('skill-1')).resolves.toEqual({ skillId: 'skill-1' });
    expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { skillId: 'skill-1' } });
  });
});

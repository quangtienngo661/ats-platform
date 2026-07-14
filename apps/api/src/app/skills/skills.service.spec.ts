import { SkillsService } from './skills.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('SkillsService', () => {
  let service: SkillsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SkillsService(prisma as any);
  });

  it('creates a skill when the name is unique, checking by name alone', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);
    prisma.skill.create.mockResolvedValue({
      skillId: 'skill-1',
      name: 'NestJS',
    });

    await service.create({ name: 'NestJS', category: 'Backend' });

    // `name` is the only unique column — adding `category` to the lookup let a
    // same-name/different-category duplicate through and then threw a raw P2002.
    expect(prisma.skill.findUnique).toHaveBeenCalledWith({
      where: { name: 'NestJS' },
    });
    expect(prisma.skill.create).toHaveBeenCalledWith({
      data: { name: 'NestJS', category: 'Backend' },
    });
  });

  it('rejects a duplicate name even when the category differs', async () => {
    prisma.skill.findUnique.mockResolvedValue({
      skillId: 'skill-1',
      name: 'TypeScript',
      category: 'Programming Language',
    });

    await expect(
      service.create({ name: 'TypeScript', category: 'Frontend' }),
    ).rejects.toThrow('đã tồn tại');
    expect(prisma.skill.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate skills', async () => {
    prisma.skill.findUnique.mockResolvedValue({ skillId: 'skill-1' });

    await expect(
      service.create({ name: 'NestJS', category: 'Backend' }),
    ).rejects.toThrow('t');
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

    await expect(service.update('missing', { name: 'React' })).rejects.toThrow(
      'Kh',
    );
  });

  it('deletes a skill that no job posting uses', async () => {
    prisma.skill.findUnique.mockResolvedValue({
      skillId: 'skill-1',
      _count: { jobPostingSkills: 0 },
    });
    prisma.skill.delete.mockResolvedValue({ skillId: 'skill-1' });

    await expect(service.remove('skill-1')).resolves.toEqual({
      skillId: 'skill-1',
    });
    expect(prisma.skill.delete).toHaveBeenCalledWith({
      where: { skillId: 'skill-1' },
    });
  });

  it('refuses to delete a skill still attached to a job posting', async () => {
    prisma.skill.findUnique.mockResolvedValue({
      skillId: 'skill-1',
      _count: { jobPostingSkills: 2 },
    });

    await expect(service.remove('skill-1')).rejects.toThrow(
      'đang được sử dụng',
    );
    expect(prisma.skill.delete).not.toHaveBeenCalled();
  });
});

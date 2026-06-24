import { JobCategoriesService } from './job-categories.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('JobCategoriesService', () => {
  let service: JobCategoriesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new JobCategoriesService(prisma as any);
  });

  it('creates a category after validating the parent', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'parent-1' });
    prisma.jobCategory.create.mockResolvedValue({ categoryId: 'cat-1' });

    await service.create({ name: 'Backend', parentCategoryId: 'parent-1' });

    expect(prisma.jobCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Backend', parentCategoryId: 'parent-1' },
      }),
    );
  });

  it('rejects a missing parent category', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue(null);

    await expect(service.create({ name: 'Backend', parentCategoryId: 'missing' })).rejects.toThrow('cha');
  });

  it('rejects setting a category as its own parent', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1' });

    await expect(service.update('cat-1', { parentCategoryId: 'cat-1' })).rejects.toThrow('ch');
  });

  it('detects circular parent chains', async () => {
    prisma.jobCategory.findUnique
      .mockResolvedValueOnce({ categoryId: 'cat-1' })
      .mockResolvedValueOnce({ categoryId: 'parent-1' })
      .mockResolvedValueOnce({ parentCategoryId: 'cat-1' });

    await expect(service.update('cat-1', { parentCategoryId: 'parent-1' })).rejects.toThrow('v');
  });

  it('does not delete a category with children', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue({
      categoryId: 'cat-1',
      childCategories: [{ categoryId: 'child-1' }],
    });

    await expect(service.remove('cat-1')).rejects.toThrow('con');
  });

  it('deletes a leaf category', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1', childCategories: [] });
    prisma.jobCategory.delete.mockResolvedValue({ categoryId: 'cat-1' });

    await expect(service.remove('cat-1')).resolves.toEqual({ categoryId: 'cat-1' });
  });
});

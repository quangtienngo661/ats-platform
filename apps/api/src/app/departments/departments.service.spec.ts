import { DepartmentsService } from './departments.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DepartmentsService(prisma as any);
  });

  it('creates a department with the expected data', async () => {
    const department = { departmentId: 'dep-1', name: 'Engineering' };
    prisma.department.create.mockResolvedValue(department);

    await expect(
      service.create({
        name: 'Engineering',
        description: 'Build team',
        color: '#123456',
      }),
    ).resolves.toBe(department);

    expect(prisma.department.create).toHaveBeenCalledWith({
      data: {
        name: 'Engineering',
        description: 'Build team',
        color: '#123456',
      },
    });
  });

  it('throws when finding a missing department', async () => {
    prisma.department.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toThrow('Kh');
  });

  it('updates only after the department exists', async () => {
    prisma.department.findUnique.mockResolvedValue({ departmentId: 'dep-1' });
    prisma.department.update.mockResolvedValue({
      departmentId: 'dep-1',
      name: 'HR',
    });

    await service.update('dep-1', { name: 'HR' });

    expect(prisma.department.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { departmentId: 'dep-1' },
        data: expect.objectContaining({ name: 'HR' }),
      }),
    );
  });

  it('deletes an empty department', async () => {
    const department = {
      departmentId: 'dep-1',
      _count: { recruiters: 0, jobPostings: 0 },
    };
    prisma.department.findUnique.mockResolvedValue(department);
    prisma.department.delete.mockResolvedValue(department);

    await expect(service.remove('dep-1')).resolves.toBe(department);
    expect(prisma.department.delete).toHaveBeenCalledWith({
      where: { departmentId: 'dep-1' },
    });
  });

  it('refuses to delete a department that still has recruiters', async () => {
    prisma.department.findUnique.mockResolvedValue({
      departmentId: 'dep-1',
      _count: { recruiters: 2, jobPostings: 0 },
    });

    await expect(service.remove('dep-1')).rejects.toThrow('nhà tuyển dụng');
    expect(prisma.department.delete).not.toHaveBeenCalled();
  });

  it('refuses to delete a department that still has job postings', async () => {
    prisma.department.findUnique.mockResolvedValue({
      departmentId: 'dep-1',
      _count: { recruiters: 0, jobPostings: 1 },
    });

    await expect(service.remove('dep-1')).rejects.toThrow('tin tuyển dụng');
    expect(prisma.department.delete).not.toHaveBeenCalled();
  });
});

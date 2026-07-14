import { UserRole } from '@ats-platform/types';
import { JobPostingsController } from './job-postings.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

const createService = () => ({
  parseJdPreview: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('JobPostingsController', () => {
  it('delegates job posting endpoints and reads current user for create', async () => {
    const service = createService();
    const controller = new JobPostingsController(service as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.recruiter });

    controller.parseJdPreview({ description: 'JD' });
    controller.create({ title: 'Backend' } as any, req);
    controller.findAll({ search: 'backend' } as any, req);
    controller.findOne('job-1', req);
    await controller.update('job-1', { title: 'Updated' } as any);
    controller.remove('job-1');

    expect(service.parseJdPreview).toHaveBeenCalledWith('JD');
    expect(service.create).toHaveBeenCalledWith('user-1', { title: 'Backend' });
    expect(service.findAll).toHaveBeenCalledWith({ search: 'backend' }, true);
    expect(service.findOne).toHaveBeenCalledWith('job-1', true);
    expect(service.update).toHaveBeenCalledWith('job-1', { title: 'Updated' });
    expect(service.remove).toHaveBeenCalledWith('job-1');
  });

  it.each([
    ['anonymous', undefined],
    ['candidate', { userId: 'user-2', role: UserRole.candidate }],
  ])('does not let a %s caller reach unpublished postings', (_label, user) => {
    const service = createService();
    const controller = new JobPostingsController(service as any);
    // OptionalJwtAuthGuard leaves req.user undefined for anonymous callers.
    const req = { user } as any;

    controller.findAll({ status: 'draft' } as any, req);
    controller.findOne('job-1', req);

    expect(service.findAll).toHaveBeenCalledWith({ status: 'draft' }, false);
    expect(service.findOne).toHaveBeenCalledWith('job-1', false);
  });

  it('lets an admin reach unpublished postings', () => {
    const service = createService();
    const controller = new JobPostingsController(service as any);
    const req = mockRequest({ userId: 'admin-1', role: UserRole.admin });

    controller.findAll({ status: 'draft' } as any, req);

    expect(service.findAll).toHaveBeenCalledWith({ status: 'draft' }, true);
  });
});

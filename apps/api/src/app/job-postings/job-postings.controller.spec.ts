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
  it('delegates job posting endpoints and passes the resolved viewer to reads', async () => {
    const service = createService();
    const controller = new JobPostingsController(service as any);
    const req = mockRequest({
      userId: 'user-1',
      role: UserRole.recruiter,
      organizationId: 'org-1',
    });
    const viewer = {
      userId: 'user-1',
      role: UserRole.recruiter,
      organizationId: 'org-1',
    };

    controller.parseJdPreview({ description: 'JD' });
    controller.create({ title: 'Backend' } as any, req);
    controller.findAll({ search: 'backend' } as any, req);
    controller.findOne('job-1', req);
    await controller.update('job-1', { title: 'Updated' } as any);
    controller.remove('job-1');

    expect(service.parseJdPreview).toHaveBeenCalledWith('JD');
    expect(service.create).toHaveBeenCalledWith('user-1', { title: 'Backend' });
    expect(service.findAll).toHaveBeenCalledWith({ search: 'backend' }, viewer);
    expect(service.findOne).toHaveBeenCalledWith('job-1', viewer);
    expect(service.update).toHaveBeenCalledWith('job-1', { title: 'Updated' });
    expect(service.remove).toHaveBeenCalledWith('job-1');
  });

  it('passes no viewer for an anonymous visitor', () => {
    const service = createService();
    const controller = new JobPostingsController(service as any);
    // OptionalJwtAuthGuard leaves req.user undefined for anonymous callers.
    const req = { user: undefined } as any;

    controller.findAll({ status: 'draft' } as any, req);
    controller.findOne('job-1', req);

    expect(service.findAll).toHaveBeenCalledWith(
      { status: 'draft' },
      undefined,
    );
    expect(service.findOne).toHaveBeenCalledWith('job-1', undefined);
  });

  it('defaults a viewer without an organization to null, never undefined', () => {
    const service = createService();
    const controller = new JobPostingsController(service as any);
    const req = mockRequest({ userId: 'user-2', role: UserRole.candidate });

    controller.findAll({} as any, req);

    expect(service.findAll).toHaveBeenCalledWith(
      {},
      { userId: 'user-2', role: UserRole.candidate, organizationId: null },
    );
  });
});

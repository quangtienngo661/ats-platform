import { UserRole } from '@ats-platform/types';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingsService } from './job-postings.service';
import { mockRequest } from '../../test-utils/unit-test-helpers';

const createService = () => ({
  parseJdPreview: jest.fn(),
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  getFilterOptions: jest.fn(),
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
    controller.create({ title: 'Backend' } as any, viewer as any);
    controller.findAll({ search: 'backend' } as any, req);
    controller.findOne('job-1', req);
    await controller.update('job-1', { title: 'Updated' } as any);
    controller.remove('job-1');

    expect(service.parseJdPreview).toHaveBeenCalledWith('JD');
    expect(service.create).toHaveBeenCalledWith(viewer, { title: 'Backend' });
    expect(service.findAll).toHaveBeenCalledWith({ search: 'backend' }, viewer);
    expect(service.findOne).toHaveBeenCalledWith('job-1', viewer);
    expect(service.update).toHaveBeenCalledWith('job-1', { title: 'Updated' });
    expect(service.remove).toHaveBeenCalledWith('job-1');
  });

  it('serves the filter options to anyone, without a viewer', () => {
    const service = createService();
    service.getFilterOptions.mockReturnValue({ skills: [] });
    const controller = new JobPostingsController(service as unknown as JobPostingsService);

    expect(controller.filterOptions()).toEqual({ skills: [] });
    expect(service.getFilterOptions).toHaveBeenCalledWith();
  });

  it('declares filter-options before :id so the id route cannot swallow it', () => {
    // Nest registers routes in method declaration order, and GET :id has no UUID pipe:
    // declared after it, "filter-options" would be read as a job id and answer 404.
    const names = Object.getOwnPropertyNames(JobPostingsController.prototype);
    expect(Reflect.getMetadata('path', JobPostingsController.prototype.filterOptions)).toBe('filter-options');
    expect(names.indexOf('filterOptions')).toBeGreaterThan(-1);
    expect(names.indexOf('filterOptions')).toBeLessThan(names.indexOf('findOne'));
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

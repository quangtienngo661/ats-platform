import { JobPostingsController } from './job-postings.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('JobPostingsController', () => {
  it('delegates job posting endpoints and reads current user for create', async () => {
    const service = {
      parseJdPreview: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const controller = new JobPostingsController(service as any);
    const req = mockRequest({ userId: 'user-1' });

    controller.parseJdPreview({ description: 'JD' });
    controller.create({ title: 'Backend' } as any, req);
    controller.findAll({ search: 'backend' } as any);
    controller.findOne('job-1');
    await controller.update('job-1', { title: 'Updated' } as any);
    controller.remove('job-1');

    expect(service.parseJdPreview).toHaveBeenCalledWith('JD');
    expect(service.create).toHaveBeenCalledWith('user-1', { title: 'Backend' });
    expect(service.findAll).toHaveBeenCalledWith({ search: 'backend' });
    expect(service.findOne).toHaveBeenCalledWith('job-1');
    expect(service.update).toHaveBeenCalledWith('job-1', { title: 'Updated' });
    expect(service.remove).toHaveBeenCalledWith('job-1');
  });
});

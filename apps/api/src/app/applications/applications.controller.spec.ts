import { UserRole } from '@ats-platform/database';
import { ApplicationsController } from './applications.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('ApplicationsController', () => {
  it('passes user id and role through application endpoints', () => {
    const service = {
      apply: jest.fn(),
      getMyApplications: jest.fn(),
      withdraw: jest.fn(),
      getAllKanbanBoard: jest.fn(),
      getKanbanBoard: jest.fn(),
      getApplicationsByJob: jest.fn(),
      updateStatus: jest.fn(),
      triggerScreening: jest.fn(),
      getApplicationHistory: jest.fn(),
      getApplicationById: jest.fn(),
    };
    const controller = new ApplicationsController(service as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.recruiter });

    controller.apply(req, { jobId: 'job-1' } as any);
    controller.getMyApplications(req);
    controller.withdraw('app-1', req);
    controller.getAllKanbanBoard(req);
    controller.getKanbanBoard('job-1', req);
    controller.getApplicationsByJob('job-1', { page: 1 } as any, req);
    controller.updateStatus('app-1', req, { status: 'interview' } as any);
    controller.triggerScreening('app-1', req, 'cfg-1');
    controller.getApplicationHistory('app-1', req);
    controller.getApplicationById('app-1', req);

    expect(service.apply).toHaveBeenCalledWith('user-1', { jobId: 'job-1' });
    expect(service.getMyApplications).toHaveBeenCalledWith('user-1');
    expect(service.withdraw).toHaveBeenCalledWith('app-1', 'user-1');
    expect(service.getAllKanbanBoard).toHaveBeenCalledWith('user-1', UserRole.recruiter);
    expect(service.getKanbanBoard).toHaveBeenCalledWith('user-1', UserRole.recruiter, 'job-1');
    expect(service.getApplicationsByJob).toHaveBeenCalledWith('user-1', UserRole.recruiter, 'job-1', { page: 1 });
    expect(service.updateStatus).toHaveBeenCalledWith('app-1', 'user-1', UserRole.recruiter, { status: 'interview' });
    expect(service.triggerScreening).toHaveBeenCalledWith('app-1', 'user-1', UserRole.recruiter, 'cfg-1');
    expect(service.getApplicationHistory).toHaveBeenCalledWith('app-1', 'user-1', UserRole.recruiter);
    expect(service.getApplicationById).toHaveBeenCalledWith('app-1', 'user-1', UserRole.recruiter);
  });
});

import { UserRole } from '@ats-platform/database';
import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApplicationsController,
  bulkScreeningTracker,
} from './applications.controller';
import { BulkScreeningDto } from './dtos/bulk-screening.dto';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { callerOf, mockRequest } from '../../test-utils/unit-test-helpers';

describe('ApplicationsController', () => {
  it('passes the user id to candidate routes and the caller to staff routes', () => {
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
    const controller = new ApplicationsController(service as any, { bulkScreen: jest.fn() } as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.candidate });
    const caller = callerOf(UserRole.recruiter);

    controller.apply(req, { jobId: 'job-1' } as any);
    controller.getMyApplications(req);
    controller.withdraw('app-1', req);
    controller.getAllKanbanBoard(caller);
    controller.getKanbanBoard('job-1', caller);
    controller.getApplicationsByJob('job-1', { page: 1 } as any, caller);
    controller.updateStatus('app-1', caller, { status: 'interview' } as any);
    controller.triggerScreening('app-1', caller, 'cfg-1');
    controller.getApplicationHistory('app-1', caller);
    controller.getApplicationById('app-1', caller);

    expect(service.apply).toHaveBeenCalledWith('user-1', { jobId: 'job-1' });
    expect(service.getMyApplications).toHaveBeenCalledWith('user-1');
    expect(service.withdraw).toHaveBeenCalledWith('app-1', 'user-1');
    expect(service.getAllKanbanBoard).toHaveBeenCalledWith(caller);
    expect(service.getKanbanBoard).toHaveBeenCalledWith(caller, 'job-1');
    expect(service.getApplicationsByJob).toHaveBeenCalledWith(caller, 'job-1', { page: 1 });
    expect(service.updateStatus).toHaveBeenCalledWith('app-1', caller, { status: 'interview' });
    expect(service.triggerScreening).toHaveBeenCalledWith('app-1', caller, 'cfg-1');
    expect(service.getApplicationHistory).toHaveBeenCalledWith('app-1', caller);
    expect(service.getApplicationById).toHaveBeenCalledWith('app-1', caller);
  });
});

describe('ApplicationsController bulk screening', () => {
  it('bulkScreening delegates to the service with caller, jobId and body', async () => {
    const bulkScreeningService = { bulkScreen: jest.fn() };
    const controller = new ApplicationsController({} as any, bulkScreeningService as any);
    const caller = callerOf(UserRole.recruiter);
    const jobId = 'job-1';
    const dto: BulkScreeningDto = {
      applicationIds: ['123e4567-e89b-42d3-a456-426614174000'],
      moveAppliedToScreening: true,
      configId: '123e4567-e89b-42d3-a456-426614174001',
    };
    const result = {
      queued: [{ applicationId: dto.applicationIds[0], movedToScreening: true }],
      skipped: [],
      remaining: 0,
    };
    bulkScreeningService.bulkScreen.mockResolvedValue(result);

    await expect(controller.bulkScreening(jobId, caller, dto)).resolves.toBe(result);

    expect(bulkScreeningService.bulkScreen).toHaveBeenCalledTimes(1);
    expect(bulkScreeningService.bulkScreen).toHaveBeenCalledWith(caller, jobId, dto);
  });

  it('the bulk route answers 200, allows recruiter and admin, and is throttled 3 per 60000 ms', () => {
    const handler = ApplicationsController.prototype.bulkScreening;

    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(200);
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(ThrottlerGuard);
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      UserRole.recruiter,
      UserRole.admin,
    ]);
    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(3);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60000);
    expect(Reflect.getMetadata('THROTTLER:TRACKERdefault', handler)).toBe(
      bulkScreeningTracker,
    );
  });

  it('the tracker counts per user and falls back to the IP', () => {
    expect(
      bulkScreeningTracker({ user: { userId: 'u1' }, ip: '10.0.0.1' }),
    ).toBe('u1');
    expect(bulkScreeningTracker({ ip: '10.0.0.1' })).toBe('10.0.0.1');
  });
});

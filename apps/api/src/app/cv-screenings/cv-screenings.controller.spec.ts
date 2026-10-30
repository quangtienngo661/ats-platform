import { RequestMethod } from '@nestjs/common';
import { CvScreeningsController } from './cv-screenings.controller';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { callerOf, mockRequest } from '../../test-utils/unit-test-helpers';
import { UserRole } from '@ats-platform/database';

describe('CvScreeningsController', () => {
  it('delegates stats and screening result endpoints', async () => {
    const service = {
      getScreeningStats: jest.fn(),
      getScreeningResultForCandidate: jest.fn(),
      getScreeningResult: jest.fn(),
    };
    const controller = new CvScreeningsController(service as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.candidate });
    const caller = callerOf(UserRole.recruiter);

    await controller.getScreeningStats(caller, 'job-1');
    await controller.getScreeningResultForCandidate(req, 'app-1');
    await controller.getScreeningResult(caller, 'app-1');

    expect(service.getScreeningStats).toHaveBeenCalledWith('job-1', caller);
    expect(service.getScreeningResultForCandidate).toHaveBeenCalledWith('app-1', 'user-1');
    expect(service.getScreeningResult).toHaveBeenCalledWith('app-1', caller);
  });

  it('delegates the review route with the caller, the application id and the body', async () => {
    const service = { reviewScreening: jest.fn() };
    const controller = new CvScreeningsController(service as any);
    const caller = callerOf(UserRole.recruiter);
    const body = { skillsScore: 80, experienceScore: 70, educationScore: 60 };

    await controller.reviewScreening(caller, 'app-1', body);

    expect(service.reviewScreening).toHaveBeenCalledWith(caller, 'app-1', body);
  });

  it('PATCH :applicationId/review is limited to admin and recruiter', () => {
    const handler = CvScreeningsController.prototype.reviewScreening;

    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
      UserRole.admin,
      UserRole.recruiter,
    ]);
    expect(Reflect.getMetadata('path', handler)).toBe(':applicationId/review');
    expect(Reflect.getMetadata('method', handler)).toBe(RequestMethod.PATCH);
  });
});

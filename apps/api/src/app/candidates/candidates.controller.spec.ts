import { CandidatesController } from './candidates.controller';
import { callerOf, mockRequest } from '../../test-utils/unit-test-helpers';
import { UserRole } from '@ats-platform/database';

describe('CandidatesController', () => {
  it('uses req.user for self-service and the caller for staff search', () => {
    const service = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    };
    const controller = new CandidatesController(service as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.candidate });
    const caller = callerOf(UserRole.recruiter);

    controller.getProfile(req);
    controller.updateProfile(req, { currentTitle: 'Backend' } as any);
    controller.findOne('cand-1', caller);
    controller.findAll({ search: 'alice' } as any, caller);

    expect(service.getProfile).toHaveBeenCalledWith('user-1');
    expect(service.updateProfile).toHaveBeenCalledWith('user-1', { currentTitle: 'Backend' });
    expect(service.findOne).toHaveBeenCalledWith('cand-1', caller);
    expect(service.findAll).toHaveBeenCalledWith({ search: 'alice' }, caller);
  });
});

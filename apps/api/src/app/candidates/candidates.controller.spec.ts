import { CandidatesController } from './candidates.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';
import { UserRole } from '@ats-platform/database';

describe('CandidatesController', () => {
  it('uses req.user for candidate self-service endpoints', () => {
    const service = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    };
    const controller = new CandidatesController(service as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.recruiter });

    controller.getProfile(req);
    controller.updateProfile(req, { currentTitle: 'Backend' } as any);
    controller.findOne('cand-1', req);
    controller.findAll({ search: 'alice' } as any, req);

    expect(service.getProfile).toHaveBeenCalledWith('user-1');
    expect(service.updateProfile).toHaveBeenCalledWith('user-1', { currentTitle: 'Backend' });
    expect(service.findOne).toHaveBeenCalledWith('cand-1', 'user-1', UserRole.recruiter);
    expect(service.findAll).toHaveBeenCalledWith({ search: 'alice' }, 'user-1', UserRole.recruiter);
  });
});

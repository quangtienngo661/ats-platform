import { UserRole } from '@ats-platform/database';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { callerOf } from '../../test-utils/unit-test-helpers';
import { CopilotController } from './copilot.controller';

describe('CopilotController', () => {
  it('passes the caller, the ids and the key to the service', async () => {
    const service = {
      suggestionsForJob: jest.fn().mockResolvedValue({}),
      apply: jest.fn().mockResolvedValue({ applied: 'invite_interview' }),
      dismiss: jest.fn().mockResolvedValue({ dismissed: 'invite_interview' }),
      explain: jest.fn().mockResolvedValue({ explanation: 'x' }),
    };
    const controller = new CopilotController(service as any);
    const caller = callerOf(UserRole.recruiter);

    await controller.suggestionsForJob('job-1', caller);
    await controller.apply('app-1', caller, { key: 'k' });
    await controller.dismiss('app-1', caller, { key: 'k' });
    await controller.explain('app-1', caller);

    expect(service.suggestionsForJob).toHaveBeenCalledWith(caller, 'job-1');
    expect(service.apply).toHaveBeenCalledWith(caller, 'app-1', 'k');
    expect(service.dismiss).toHaveBeenCalledWith(caller, 'app-1', 'k');
    expect(service.explain).toHaveBeenCalledWith(caller, 'app-1');
  });

  it('is for staff only (org_admin passes as recruiter); candidates are not in the list', () => {
    expect(Reflect.getMetadata(ROLES_KEY, CopilotController)).toEqual([UserRole.recruiter, UserRole.admin]);
  });
});

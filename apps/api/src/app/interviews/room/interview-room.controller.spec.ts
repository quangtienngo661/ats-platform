import { UserRole } from '@ats-platform/database';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { callerOf } from '../../../test-utils/unit-test-helpers';
import { InterviewRoomController } from './interview-room.controller';

describe('InterviewRoomController', () => {
  it('passes the caller to the room service', async () => {
    const roomService = { join: jest.fn().mockResolvedValue({ token: 't' }) };
    const controller = new InterviewRoomController(roomService as any);
    const caller = callerOf(UserRole.candidate, { userId: 'cand-1', organizationId: null });

    await expect(controller.join('int-1', caller)).resolves.toEqual({ token: 't' });
    expect(roomService.join).toHaveBeenCalledWith('int-1', caller);
  });

  it('is open to candidates and staff; who is in the interview is the service’s check', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, InterviewRoomController.prototype.join);

    expect(roles).toEqual([UserRole.candidate, UserRole.recruiter, UserRole.admin]);
  });
});

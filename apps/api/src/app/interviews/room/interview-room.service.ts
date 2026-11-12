import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UserRole } from '@ats-platform/database';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiveKitService } from '../../../common/external-apis/livekit/livekit.service';
import {
  isPlatformAdmin,
  isOrganizationStaff,
  TenantCaller,
} from '../../../common/tenancy/tenant-caller';
import { assertCanJoinNow, roomName } from './interview-room.rules';

export const NOT_A_PARTICIPANT_MESSAGE = 'Bạn không tham gia buổi phỏng vấn này';
export const ROOM_NOT_CONFIGURED_MESSAGE =
  'Phòng phỏng vấn trực tuyến chưa được cấu hình';

export type RoomRole = 'candidate' | 'interviewer';

export interface InterviewRoomAccess {
  serverUrl: string;
  token: string;
  roomName: string;
  identity: string;
  displayName: string;
  role: RoomRole;
  /** When the token, and the room's join window, end. */
  expiresAt: string;
}

const scheduleForJoin = {
  interviewId: true,
  organizationId: true,
  interviewType: true,
  status: true,
  startAt: true,
  durationMinutes: true,
  scheduledBy: true,
  interviewerId: true,
  scheduler: { select: { fullName: true } },
  interviewer: { select: { fullName: true } },
  application: {
    select: {
      candidate: { select: { userId: true, user: { select: { fullName: true } } } },
    },
  },
} as const;

@Injectable()
export class InterviewRoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly liveKit: LiveKitService,
  ) {}

  /**
   * A LiveKit token for the people IN the interview: the application's candidate, the
   * interviewer and whoever scheduled it (decision D4). Others who may view the schedule
   * cannot join. Order: exists → participant → time window → configured, so nobody
   * outside the interview learns anything about its timing or the server's setup.
   */
  async join(
    interviewId: string,
    caller: TenantCaller,
    now: Date = new Date(),
  ): Promise<InterviewRoomAccess> {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId },
      select: scheduleForJoin,
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');

    const participant = this.participantOf(schedule, caller);
    if (!participant) throw new ForbiddenException(NOT_A_PARTICIPANT_MESSAGE);

    const window = assertCanJoinNow(schedule, now);

    const serverUrl = this.liveKit.publicUrl();
    if (!this.liveKit.isConfigured() || !serverUrl) {
      throw new ServiceUnavailableException(ROOM_NOT_CONFIGURED_MESSAGE);
    }

    const room = roomName(schedule.interviewId);
    const token = await this.liveKit.createRoomToken({
      room,
      identity: caller.userId,
      name: participant.displayName,
      metadata: JSON.stringify({ role: participant.role }),
      expiresAt: window.closesAt,
      now,
    });

    return {
      serverUrl,
      token,
      roomName: room,
      identity: caller.userId,
      displayName: participant.displayName,
      role: participant.role,
      expiresAt: window.closesAt.toISOString(),
    };
  }

  private participantOf(
    schedule: {
      organizationId: string;
      scheduledBy: string;
      interviewerId: string;
      scheduler: { fullName: string };
      interviewer: { fullName: string };
      application: { candidate: { userId: string; user: { fullName: string } } };
    },
    caller: TenantCaller,
  ): { role: RoomRole; displayName: string } | null {
    if (caller.role === UserRole.candidate) {
      const candidate = schedule.application.candidate;
      return candidate.userId === caller.userId
        ? { role: 'candidate', displayName: candidate.user.fullName }
        : null;
    }

    // Staff must still belong to the schedule's organization: one who moved away keeps
    // no access, as in assertCanViewSchedule. A platform admin belongs to none.
    const inOrganization =
      isPlatformAdmin(caller.role) ||
      (isOrganizationStaff(caller.role) &&
        caller.organizationId === schedule.organizationId);
    if (!inOrganization) return null;

    if (schedule.interviewerId === caller.userId) {
      return { role: 'interviewer', displayName: schedule.interviewer.fullName };
    }
    if (schedule.scheduledBy === caller.userId) {
      return { role: 'interviewer', displayName: schedule.scheduler.fullName };
    }
    return null;
  }
}

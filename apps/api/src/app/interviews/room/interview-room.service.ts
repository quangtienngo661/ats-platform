import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { NotificationType, RelatedEntityType, UserRole } from '@ats-platform/database';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { LiveKitService } from '../../../common/external-apis/livekit/livekit.service';
import { SocketIoService } from '../../../common/socket-io/socket-io.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  isPlatformAdmin,
  isOrganizationStaff,
  TenantCaller,
} from '../../../common/tenancy/tenant-caller';
import { assertCanJoinNow, roomName } from './interview-room.rules';

export const NOT_A_PARTICIPANT_MESSAGE = 'Bạn không tham gia buổi phỏng vấn này';
export const ROOM_NOT_CONFIGURED_MESSAGE =
  'Phòng phỏng vấn trực tuyến chưa được cấu hình';
export const ONLY_INTERVIEWER_ADMITS_MESSAGE =
  'Chỉ người phỏng vấn được cho ứng viên vào phòng';

/** Socket.IO events of the waiting room (GĐ4 R25, R26). */
export const ROOM_WAITING_EVENT = 'interview-room:waiting';
export const ROOM_ADMITTED_EVENT = 'interview-room:admitted';

export type RoomRole = 'candidate' | 'interviewer';

export interface WaitingCandidate {
  name: string;
  since: string;
}

export interface InterviewRoomAccess {
  status: 'admitted';
  serverUrl: string;
  token: string;
  roomName: string;
  identity: string;
  displayName: string;
  role: RoomRole;
  /** When the token, and the room's join window, end. */
  expiresAt: string;
  /** For the interviewer: the candidate waiting to be let in, if any. */
  waitingCandidate: WaitingCandidate | null;
}

/** A candidate the interviewer has not let in yet gets no token (decision D13). */
export interface InterviewRoomWaiting {
  status: 'waiting';
  displayName: string;
  since: string;
  closesAt: string;
}

export type InterviewRoomJoin = InterviewRoomAccess | InterviewRoomWaiting;

const scheduleForJoin = {
  interviewId: true,
  organizationId: true,
  interviewType: true,
  status: true,
  startAt: true,
  durationMinutes: true,
  scheduledBy: true,
  interviewerId: true,
  candidateWaitingAt: true,
  candidateAdmittedAt: true,
  scheduler: { select: { fullName: true } },
  interviewer: { select: { fullName: true } },
  application: {
    select: {
      candidate: { select: { userId: true, user: { select: { fullName: true } } } },
      jobPosting: { select: { title: true } },
    },
  },
} as const;

interface ScheduleForJoin {
  interviewId: string;
  organizationId: string;
  scheduledBy: string;
  interviewerId: string;
  candidateWaitingAt: Date | null;
  candidateAdmittedAt: Date | null;
  scheduler: { fullName: string };
  interviewer: { fullName: string };
  application: {
    candidate: { userId: string; user: { fullName: string } };
    jobPosting: { title: string };
  };
}

@Injectable()
export class InterviewRoomService {
  private readonly logger = new Logger(InterviewRoomService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly liveKit: LiveKitService,
    private readonly socketIo: SocketIoService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * A LiveKit token for the people IN the interview: the application's candidate, the
   * interviewer and whoever scheduled it (decision D4). Others who may view the schedule
   * cannot join. Order: exists → participant → time window → configured → waiting room,
   * so nobody outside the interview learns anything about its timing or the server's
   * setup, and no candidate waits in a room nobody can open.
   */
  async join(
    interviewId: string,
    caller: TenantCaller,
    now: Date = new Date(),
  ): Promise<InterviewRoomJoin> {
    const schedule = await this.findSchedule(interviewId);

    const participant = this.participantOf(schedule, caller);
    if (!participant) throw new ForbiddenException(NOT_A_PARTICIPANT_MESSAGE);

    const window = assertCanJoinNow(schedule, now);

    const serverUrl = this.liveKit.publicUrl();
    if (!this.liveKit.isConfigured() || !serverUrl) {
      throw new ServiceUnavailableException(ROOM_NOT_CONFIGURED_MESSAGE);
    }

    if (participant.role === 'candidate' && !schedule.candidateAdmittedAt) {
      const since = await this.markWaiting(schedule, now);
      return {
        status: 'waiting',
        displayName: participant.displayName,
        since: since.toISOString(),
        closesAt: window.closesAt.toISOString(),
      };
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

    const waitingSince =
      participant.role === 'interviewer' && !schedule.candidateAdmittedAt
        ? schedule.candidateWaitingAt
        : null;

    return {
      status: 'admitted',
      serverUrl,
      token,
      roomName: room,
      identity: caller.userId,
      displayName: participant.displayName,
      role: participant.role,
      expiresAt: window.closesAt.toISOString(),
      waitingCandidate: waitingSince
        ? {
            name: schedule.application.candidate.user.fullName,
            since: waitingSince.toISOString(),
          }
        : null,
    };
  }

  /**
   * The interviewer (or whoever scheduled the interview) lets the candidate in, inside
   * the room's window. Calling it again keeps the first time.
   */
  async admit(
    interviewId: string,
    caller: TenantCaller,
    now: Date = new Date(),
  ): Promise<{ admittedAt: string }> {
    const schedule = await this.findSchedule(interviewId);

    const participant = this.participantOf(schedule, caller);
    if (!participant) throw new ForbiddenException(NOT_A_PARTICIPANT_MESSAGE);
    if (participant.role !== 'interviewer') {
      throw new ForbiddenException(ONLY_INTERVIEWER_ADMITS_MESSAGE);
    }

    assertCanJoinNow(schedule, now);

    const { count } = await this.prisma.interviewSchedule.updateMany({
      where: { interviewId, candidateAdmittedAt: null },
      data: { candidateAdmittedAt: now },
    });
    const admittedAt = count === 1 ? now : (schedule.candidateAdmittedAt ?? now);

    for (const userId of uniqueIds(
      schedule.application.candidate.userId,
      schedule.interviewerId,
      schedule.scheduledBy,
    )) {
      this.socketIo.handleEmit(ROOM_ADMITTED_EVENT, { interviewId }, `user_${userId}`);
    }

    return { admittedAt: admittedAt.toISOString() };
  }

  private async findSchedule(interviewId: string) {
    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { interviewId },
      select: scheduleForJoin,
    });
    if (!schedule) throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    return schedule;
  }

  /**
   * Records when the candidate began to wait (first call only), tells the interviewer
   * and the scheduler over Socket.IO on every call, and leaves them a notification the
   * first time. A notification that cannot be saved does not stop the wait.
   */
  private async markWaiting(schedule: ScheduleForJoin, now: Date): Promise<Date> {
    const { count } = await this.prisma.interviewSchedule.updateMany({
      where: { interviewId: schedule.interviewId, candidateWaitingAt: null },
      data: { candidateWaitingAt: now },
    });
    const firstWait = count === 1;
    const since = firstWait ? now : (schedule.candidateWaitingAt ?? now);
    const candidateName = schedule.application.candidate.user.fullName;
    const staff = uniqueIds(schedule.interviewerId, schedule.scheduledBy);

    for (const userId of staff) {
      this.socketIo.handleEmit(
        ROOM_WAITING_EVENT,
        { interviewId: schedule.interviewId, candidateName, since: since.toISOString() },
        `user_${userId}`,
      );
    }

    if (firstWait) {
      for (const userId of staff) {
        await this.notifications
          .create({
            userId,
            type: NotificationType.interview,
            title: 'Ứng viên đang chờ',
            message: `${candidateName} đang chờ trong phòng phỏng vấn vị trí ${schedule.application.jobPosting.title}.`,
            relatedEntityId: schedule.interviewId,
            relatedEntityType: RelatedEntityType.interview,
          })
          .catch((error: unknown) =>
            this.logger.warn(
              `Could not save the waiting-room notification for interview ${schedule.interviewId}: ${String(error)}`,
            ),
          );
      }
    }

    return since;
  }

  private participantOf(
    schedule: ScheduleForJoin,
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

function uniqueIds(...ids: string[]): string[] {
  return [...new Set(ids)];
}

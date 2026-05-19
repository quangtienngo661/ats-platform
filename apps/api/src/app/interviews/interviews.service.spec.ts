import { ApplicationStatus, InterviewStatus, InterviewType, UserRole } from '@ats-platform/database';
import { InterviewsService } from './interviews.service';
import { createPrismaMock } from '../../test-utils/unit-test-helpers';

describe('InterviewsService', () => {
  let service: InterviewsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new InterviewsService(prisma as any);
  });

  it('creates a schedule for an interview-stage application', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      status: ApplicationStatus.interview,
      jobPosting: { departmentId: 'dep-1' },
    });
    prisma.recruiter.findUnique.mockResolvedValue({
      recruiterId: 'rec-1',
      departmentId: 'dep-1',
      user: { userId: 'interviewer-1', role: UserRole.recruiter },
    });
    prisma.interviewSchedule.create.mockResolvedValue({ interviewId: 'int-1' });

    await service.createSchedule('admin-1', UserRole.admin, {
      applicationId: 'app-1',
      interviewerId: 'interviewer-1',
      interviewType: InterviewType.online,
      scheduledDate: '2026-06-01',
      scheduledTime: '2026-06-01T09:00:00.000Z',
      onlineMeetingLink: 'https://meet.test',
    } as any);

    expect(prisma.interviewSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationId: 'app-1',
          scheduledBy: 'admin-1',
          interviewerId: 'interviewer-1',
        }),
      }),
    );
  });

  it('rejects scheduling when application is not in interview status', async () => {
    prisma.application.findUnique.mockResolvedValue({
      applicationId: 'app-1',
      status: ApplicationStatus.screening,
      jobPosting: { departmentId: 'dep-1' },
    });

    await expect(
      service.createSchedule('admin-1', UserRole.admin, { applicationId: 'app-1' } as any),
    ).rejects.toThrow('tr');
  });

  it('filters my schedules for candidates with date range pagination', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewSchedule.findMany.mockResolvedValue([{ interviewId: 'int-1' }]);
    prisma.interviewSchedule.count.mockResolvedValue(1);

    await expect(
      service.getMySchedules('user-1', UserRole.candidate, {
        page: 2,
        limit: 5,
        fromDate: '2026-06-01',
        toDate: '2026-06-02',
      } as any),
    ).resolves.toEqual({
      data: [{ interviewId: 'int-1' }],
      meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
    });

    expect(prisma.interviewSchedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          application: { candidateId: 'cand-1' },
          scheduledDate: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
        skip: 5,
        take: 5,
      }),
    );
  });

  it('creates, updates, and blocks deletion of interview topics with sessions', async () => {
    prisma.jobCategory.findUnique.mockResolvedValue({ categoryId: 'cat-1' });
    prisma.interviewTopic.create.mockResolvedValue({ topicId: 'topic-1' });

    await service.createTopic({ name: 'Backend', categoryId: 'cat-1' });
    expect(prisma.interviewTopic.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Backend', category: { connect: { categoryId: 'cat-1' } } },
      }),
    );

    prisma.interviewTopic.findUnique.mockResolvedValue({ topicId: 'topic-1', _count: { sessions: 1 } });
    await expect(service.removeTopic('topic-1')).rejects.toThrow('x');
  });

  it('hides interview session results from non-owners', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewResult.findUnique.mockResolvedValue({
      resultId: 'result-1',
      session: { candidateId: 'other' },
    });

    await expect(service.getSessionResult('session-1', 'user-1')).rejects.toThrow('qu');
  });

  it('returns my session summaries for a candidate', async () => {
    prisma.candidate.findUnique.mockResolvedValue({ candidateId: 'cand-1' });
    prisma.interviewSession.findMany.mockResolvedValue([
      { sessionId: 'session-1', status: InterviewStatus.completed },
    ]);

    await expect(service.getMySessions('user-1')).resolves.toEqual([
      { sessionId: 'session-1', status: InterviewStatus.completed },
    ]);
  });
});

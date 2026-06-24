import { UserRole } from '@ats-platform/database';
import { InterviewsController } from './interviews.controller';
import { mockRequest } from '../../test-utils/unit-test-helpers';

describe('InterviewsController', () => {
  it('delegates schedule and topic endpoints', () => {
    const interviewsService = {
      createSchedule: jest.fn(),
      getMySchedules: jest.fn(),
      getScheduleById: jest.fn(),
      updateSchedule: jest.fn(),
      removeSchedule: jest.fn(),
      createTopic: jest.fn(),
      findAllTopics: jest.fn(),
      findTopicById: jest.fn(),
      updateTopic: jest.fn(),
      removeTopic: jest.fn(),
      getMySessions: jest.fn(),
      getSessionById: jest.fn(),
      getSessionResult: jest.fn(),
    };
    const sessionService = {
      startSession: jest.fn(),
      resumeSession: jest.fn(),
      abandonSession: jest.fn(),
    };
    const controller = new InterviewsController(interviewsService as any, sessionService as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.recruiter });

    controller.createSchedule(req, { applicationId: 'app-1' } as any);
    controller.getMySchedules(req, { page: 1 } as any);
    controller.getScheduleById('int-1', req);
    controller.updateSchedule('int-1', req, { status: 'scheduled' } as any);
    controller.removeSchedule('int-1', req);
    controller.createTopic({ name: 'Backend' } as any);
    controller.findAllTopics();
    controller.findTopicById('topic-1');
    controller.updateTopic('topic-1', { name: 'Frontend' } as any);
    controller.removeTopic('topic-1');

    expect(interviewsService.createSchedule).toHaveBeenCalledWith('user-1', UserRole.recruiter, { applicationId: 'app-1' });
    expect(interviewsService.getMySchedules).toHaveBeenCalledWith('user-1', UserRole.recruiter, { page: 1 });
    expect(interviewsService.getScheduleById).toHaveBeenCalledWith('int-1', 'user-1', UserRole.recruiter);
    expect(interviewsService.updateSchedule).toHaveBeenCalledWith('int-1', 'user-1', UserRole.recruiter, { status: 'scheduled' });
    expect(interviewsService.removeSchedule).toHaveBeenCalledWith('int-1', 'user-1', UserRole.recruiter);
    expect(interviewsService.createTopic).toHaveBeenCalledWith({ name: 'Backend' });
    expect(interviewsService.findAllTopics).toHaveBeenCalled();
    expect(interviewsService.findTopicById).toHaveBeenCalledWith('topic-1');
    expect(interviewsService.updateTopic).toHaveBeenCalledWith('topic-1', { name: 'Frontend' });
    expect(interviewsService.removeTopic).toHaveBeenCalledWith('topic-1');
  });

  it('delegates AI session endpoints to the correct services', () => {
    const interviewsService = {
      getMySessions: jest.fn(),
      getSessionById: jest.fn(),
      getSessionResult: jest.fn(),
    };
    const sessionService = {
      startSession: jest.fn(),
      resumeSession: jest.fn(),
      abandonSession: jest.fn(),
    };
    const controller = new InterviewsController(interviewsService as any, sessionService as any);
    const req = mockRequest({ userId: 'user-1', role: UserRole.candidate });

    controller.startSession(req, { topicId: 'topic-1' } as any);
    controller.resumeSession(req);
    controller.abandonSession('session-1', req);
    controller.getMySessions(req);
    controller.getInterviewById('session-1', req);
    controller.getSessionResult('session-1', req);

    expect(sessionService.startSession).toHaveBeenCalledWith('user-1', { topicId: 'topic-1' });
    expect(sessionService.resumeSession).toHaveBeenCalledWith('user-1');
    expect(sessionService.abandonSession).toHaveBeenCalledWith('session-1', 'user-1');
    expect(interviewsService.getMySessions).toHaveBeenCalledWith('user-1');
    expect(interviewsService.getSessionById).toHaveBeenCalledWith('session-1', 'user-1');
    expect(interviewsService.getSessionResult).toHaveBeenCalledWith('session-1', 'user-1');
  });
});

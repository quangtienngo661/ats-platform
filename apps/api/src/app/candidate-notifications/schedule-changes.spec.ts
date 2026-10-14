import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import {
  type ScheduleSnapshot,
  toScheduleSnapshot,
  changedScheduleFields,
} from './schedule-changes';

describe('schedule changes', () => {
  const snapshot = (): ScheduleSnapshot => ({
    interviewId: 'd8c436c5-3017-4635-9c1f-5334f9987404',
    applicationId: 'c2ba6519-7149-4af6-b335-f456fdd0c020',
    interviewerId: '02733460-e749-4ef0-b604-f2c72b978c11',
    interviewType: InterviewType.online,
    startAt: new Date('2026-10-20T02:30:00Z'),
    durationMinutes: 60,
    onlineMeetingLink: 'https://meet.example.com/backend-interview',
    location: null,
    status: ScheduleStatus.scheduled,
  });

  const changes = {
    // Deliberately insert these in the reverse of the ScheduleField union order.
    interviewerId: '10b15e89-b2ee-4463-96d3-d0fd19edb422',
    location: 'Tầng 5, 123 Nguyễn Huệ, Thành phố Hồ Chí Minh',
    onlineMeetingLink: 'https://meet.example.com/backend-interview-new',
    interviewType: InterviewType.onsite,
    durationMinutes: 90,
    startAt: new Date('2026-10-20T03:30:00Z'),
  };

  it.each([
    'startAt',
    'durationMinutes',
    'interviewType',
    'onlineMeetingLink',
    'location',
    'interviewerId',
  ] as const)('reports %s when it differs', (field) => {
    const before = snapshot();
    const after = { ...before, [field]: changes[field] };

    expect(changedScheduleFields(before, after)).toEqual([field]);

    if (field === 'interviewerId') {
      expect(changedScheduleFields(before, { ...before, ...changes })).toEqual([
        'startAt',
        'durationMinutes',
        'interviewType',
        'onlineMeetingLink',
        'location',
        'interviewerId',
      ]);
    }
  });

  it('treats the same instant as unchanged', () => {
    const before = snapshot();
    const after = {
      ...before,
      startAt: new Date('2026-10-20T09:30:00+07:00'),
    };

    expect(before.startAt).not.toBe(after.startAt);
    expect(changedScheduleFields(before, after)).toEqual([]);
  });

  it('treats null and undefined as the same', () => {
    const before = { ...snapshot(), onlineMeetingLink: null, location: null };
    const after = {
      ...before,
      onlineMeetingLink: undefined,
      location: undefined,
    } as unknown as ScheduleSnapshot;

    expect(changedScheduleFields(before, after)).toEqual([]);
    expect(changedScheduleFields(after, before)).toEqual([]);
  });

  it('ignores a status-only change', () => {
    const before = snapshot();

    for (const status of [ScheduleStatus.cancelled, ScheduleStatus.completed]) {
      expect(changedScheduleFields(before, { ...before, status })).toEqual([]);
    }
  });

  it('toScheduleSnapshot keeps only the snapshot fields', () => {
    const row = {
      ...snapshot(),
      createdAt: new Date('2026-10-14T01:00:00Z'),
      updatedAt: new Date('2026-10-14T02:00:00Z'),
      staffNotes: 'Trao đổi riêng của nhà tuyển dụng',
      interviewer: { fullName: 'Trần Hoàng Nam' },
      application: { rejectionReason: 'Thông tin nội bộ' },
    } as ScheduleSnapshot;

    expect(toScheduleSnapshot(row)).toEqual({
      interviewId: 'd8c436c5-3017-4635-9c1f-5334f9987404',
      applicationId: 'c2ba6519-7149-4af6-b335-f456fdd0c020',
      interviewerId: '02733460-e749-4ef0-b604-f2c72b978c11',
      interviewType: InterviewType.online,
      startAt: new Date('2026-10-20T02:30:00Z'),
      durationMinutes: 60,
      onlineMeetingLink: 'https://meet.example.com/backend-interview',
      location: null,
      status: ScheduleStatus.scheduled,
    });
  });
});

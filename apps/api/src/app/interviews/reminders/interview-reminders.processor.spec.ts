import { InterviewRemindersProcessor } from './interview-reminders.processor';

describe('InterviewRemindersProcessor', () => {
  let reminders: { deliver: jest.Mock };
  let processor: InterviewRemindersProcessor;
  const data = { interviewId: 'int-1', startAt: '2026-11-20T02:00:00.000Z' };

  beforeEach(() => {
    reminders = { deliver: jest.fn().mockResolvedValue(undefined) };
    processor = new InterviewRemindersProcessor(reminders as any);
  });

  it.each(['reminder', 'room-open'])('delivers a %s job', async (name) => {
    await processor.process({ name, data } as any);

    expect(reminders.deliver).toHaveBeenCalledWith(name, data);
  });

  it('ignores jobs it does not own', async () => {
    await processor.process({ name: 'something_else', data } as any);

    expect(reminders.deliver).not.toHaveBeenCalled();
  });

  it('rethrows a failure so BullMQ retries the job', async () => {
    reminders.deliver.mockRejectedValue(new Error('db down'));

    await expect(processor.process({ name: 'reminder', data, id: 'j-1' } as any)).rejects.toThrow('db down');
  });
});

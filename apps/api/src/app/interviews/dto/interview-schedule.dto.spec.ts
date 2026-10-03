import { InterviewType } from '@ats-platform/database';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateInterviewScheduleDto } from './create-interview.dto';
import { UpdateInterviewScheduleDto } from './update-interview.dto';

// The global ValidationPipe validates a plainToInstance copy of the body, the same thing
// these tests do; with its validator options set it then hands the controller that
// transformed copy (classToPlain), so @Transform(trimString) reaches the service.
const baseCreate = {
  applicationId: '6f0f6f3a-7a3c-4b8e-9b2a-1c1d2e3f4a5b',
  interviewerId: '0b5f2f42-87f0-4dbe-b861-cde1e7f6e11e',
  startAt: '2026-10-05T02:00:00.000Z',
  durationMinutes: 60,
};

async function createErrors(payload: Record<string, unknown>) {
  return validate(plainToInstance(CreateInterviewScheduleDto, { ...baseCreate, ...payload }));
}

function messagesFor(errors: Awaited<ReturnType<typeof validate>>, property: string) {
  return Object.values(errors.find((error) => error.property === property)?.constraints ?? {});
}

describe('CreateInterviewScheduleDto — interview type rules (R3)', () => {
  it('requires a location for an onsite interview', async () => {
    const errors = await createErrors({ interviewType: InterviewType.onsite });
    expect(messagesFor(errors, 'location')).toContain('Phỏng vấn trực tiếp cần địa điểm');
  });

  it('treats a whitespace-only location as missing', async () => {
    const errors = await createErrors({ interviewType: InterviewType.onsite, location: '   ' });
    expect(messagesFor(errors, 'location')).toContain('Phỏng vấn trực tiếp cần địa điểm');
  });

  it('refuses a location longer than 255 characters', async () => {
    const errors = await createErrors({ interviewType: InterviewType.onsite, location: 'a'.repeat(256) });
    expect(messagesFor(errors, 'location')).toContain('Địa điểm tối đa 255 ký tự');
  });

  it('accepts an onsite interview with its address', async () => {
    await expect(
      createErrors({ interviewType: InterviewType.onsite, location: 'Tầng 5, 123 Lê Lợi, Q.1' }),
    ).resolves.toEqual([]);
  });

  it('requires a meeting link for an online interview', async () => {
    const errors = await createErrors({ interviewType: InterviewType.online });
    expect(messagesFor(errors, 'onlineMeetingLink')).toContain('Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ');
  });

  it('refuses a non-http(s) meeting link', async () => {
    const errors = await createErrors({ interviewType: InterviewType.online, onlineMeetingLink: 'javascript:alert(1)' });
    expect(messagesFor(errors, 'onlineMeetingLink')).toContain('Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ');
  });

  it('accepts a meeting link with surrounding spaces and an upper-case scheme', async () => {
    await expect(
      createErrors({ interviewType: InterviewType.online, onlineMeetingLink: '  HTTPS://meet.example.com/abc  ' }),
    ).resolves.toEqual([]);
  });
});

describe('UpdateInterviewScheduleDto — interview type rules (R3)', () => {
  it('accepts a change of duration alone', async () => {
    await expect(validate(plainToInstance(UpdateInterviewScheduleDto, { durationMinutes: 90 }))).resolves.toEqual([]);
  });

  it('refuses a non-http(s) meeting link', async () => {
    const errors = await validate(plainToInstance(UpdateInterviewScheduleDto, { onlineMeetingLink: 'ftp://files.example.com' }));
    expect(messagesFor(errors, 'onlineMeetingLink')).toContain('Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ');
  });

  it('refuses a location longer than 255 characters', async () => {
    const errors = await validate(plainToInstance(UpdateInterviewScheduleDto, { location: 'a'.repeat(256) }));
    expect(messagesFor(errors, 'location')).toContain('Địa điểm tối đa 255 ký tự');
  });
});

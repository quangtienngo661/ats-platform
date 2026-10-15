import { EmailNotificationType, InterviewType } from '@ats-platform/database';
import {
  escapeHtml,
  fillLayout,
  formatInterviewTime,
  formatVietnamDate,
} from './format';
import type {
  NotificationEmailPayload,
  RenderedEmail,
  ScheduleDetails,
} from './notification-email.types';

const SUBJECT_PREFIXES: Record<EmailNotificationType, string> = {
  application_received: 'Đã nhận đơn ứng tuyển',
  application_interview: 'Bạn được mời vào vòng phỏng vấn',
  application_offer: 'Đề nghị tuyển dụng',
  application_hired: 'Chúc mừng bạn đã trúng tuyển',
  application_rejected: 'Kết quả đơn ứng tuyển',
  schedule_created: 'Lịch phỏng vấn',
  schedule_updated: 'Lịch phỏng vấn đã thay đổi',
  schedule_cancelled: 'Lịch phỏng vấn đã bị hủy',
};

interface EmailLine {
  html: string;
  text: string;
}

function paragraph(text: string): EmailLine {
  return {
    html: `<p style="margin: 0 0 16px;">${escapeHtml(text)}</p>`,
    text,
  };
}

function meetingLinkLine(url: string | null): EmailLine {
  if (url === null) return paragraph('Link phòng họp: không có');

  const escapedUrl = escapeHtml(url);
  return {
    html: `<p style="margin: 0 0 16px;">Link phòng họp: <a href="${escapedUrl}" style="color: #0071E3; word-break: break-all;">${escapedUrl}</a></p>`,
    text: `Link phòng họp: ${url}`,
  };
}

function interviewTypeLabel(type: InterviewType): string {
  return type === InterviewType.online ? 'Trực tuyến' : 'Trực tiếp';
}

function scheduleDetailLines(schedule: ScheduleDetails): EmailLine[] {
  return [
    paragraph(
      `Thời gian: ${formatInterviewTime(schedule.startAt, schedule.durationMinutes)}`,
    ),
    paragraph(`Thời lượng: ${schedule.durationMinutes} phút`),
    paragraph(`Hình thức: ${interviewTypeLabel(schedule.interviewType)}`),
    schedule.interviewType === InterviewType.online
      ? meetingLinkLine(schedule.onlineMeetingLink)
      : paragraph(`Địa điểm: ${schedule.location ?? 'chưa cập nhật'}`),
    paragraph(`Người phỏng vấn: ${schedule.interviewerName}`),
  ];
}

function previousDetailLines(
  schedule: ScheduleDetails,
  previous: Partial<ScheduleDetails>,
): EmailLine[] {
  const lines: EmailLine[] = [];

  if (previous.startAt !== undefined) {
    lines.push(
      paragraph(
        `Thời gian: ${formatInterviewTime(previous.startAt, previous.durationMinutes ?? schedule.durationMinutes)}`,
      ),
    );
  }
  if (previous.durationMinutes !== undefined) {
    lines.push(paragraph(`Thời lượng: ${previous.durationMinutes} phút`));
  }
  if (previous.interviewType !== undefined) {
    lines.push(
      paragraph(`Hình thức: ${interviewTypeLabel(previous.interviewType)}`),
    );
  }
  if (previous.onlineMeetingLink !== undefined) {
    lines.push(meetingLinkLine(previous.onlineMeetingLink));
  }
  if (previous.location !== undefined) {
    lines.push(paragraph(`Địa điểm: ${previous.location ?? 'chưa cập nhật'}`));
  }
  if (previous.interviewerName !== undefined) {
    lines.push(paragraph(`Người phỏng vấn: ${previous.interviewerName}`));
  }

  return lines;
}

function requireSchedule(payload: NotificationEmailPayload): ScheduleDetails {
  if (!payload.schedule) {
    throw new Error('Schedule details are required for schedule notifications.');
  }
  return payload.schedule;
}

export function renderNotificationEmail(
  type: EmailNotificationType,
  payload: NotificationEmailPayload,
  options: { clientUrl: string; layout: string },
): RenderedEmail {
  const { context } = payload;
  const { jobTitle, organizationName } = context;
  const subject = `${SUBJECT_PREFIXES[type]}: ${jobTitle}`.replace(/[\r\n]/g, '');
  const lines: EmailLine[] = [paragraph(`Chào ${context.candidateName},`)];

  switch (type) {
    case EmailNotificationType.application_received:
      lines.push(
        paragraph(
          `Chúng tôi đã nhận đơn ứng tuyển của bạn cho vị trí ${jobTitle} tại ${organizationName} ngày ${formatVietnamDate(context.appliedAt)}.`,
        ),
      );
      break;
    case EmailNotificationType.application_interview:
      lines.push(
        paragraph(
          `Đơn ứng tuyển của bạn cho vị trí ${jobTitle} tại ${organizationName} đã được chuyển sang vòng phỏng vấn.`,
        ),
        paragraph('Nhà tuyển dụng sẽ gửi lịch phỏng vấn cho bạn.'),
      );
      break;
    case EmailNotificationType.application_offer:
      lines.push(
        paragraph(
          `Đơn ứng tuyển của bạn cho vị trí ${jobTitle} tại ${organizationName} đã được chuyển sang vòng đề nghị tuyển dụng.`,
        ),
      );
      break;
    case EmailNotificationType.application_hired:
      lines.push(
        paragraph(
          `Chúc mừng! Bạn đã trúng tuyển vị trí ${jobTitle} tại ${organizationName}.`,
        ),
      );
      break;
    case EmailNotificationType.application_rejected:
      lines.push(
        paragraph(
          `Cảm ơn bạn đã quan tâm đến vị trí ${jobTitle} tại ${organizationName}.`,
        ),
        paragraph(
          'Sau khi xem xét, hồ sơ của bạn chưa phù hợp với vị trí này ở thời điểm hiện tại.',
        ),
      );
      for (const schedule of payload.cancelledSchedules ?? []) {
        lines.push(
          paragraph(
            `Buổi phỏng vấn lúc ${formatInterviewTime(schedule.startAt, schedule.durationMinutes)} đã được hủy.`,
          ),
        );
      }
      break;
    case EmailNotificationType.schedule_created:
    case EmailNotificationType.schedule_updated: {
      const schedule = requireSchedule(payload);
      lines.push(
        paragraph(
          type === EmailNotificationType.schedule_created
            ? `Bạn có lịch phỏng vấn cho vị trí ${jobTitle} tại ${organizationName}.`
            : `Lịch phỏng vấn cho vị trí ${jobTitle} tại ${organizationName} đã thay đổi. Thông tin mới:`,
        ),
        ...scheduleDetailLines(schedule),
      );
      if (type === EmailNotificationType.schedule_updated) {
        lines.push(
          paragraph('Trước đây:'),
          ...previousDetailLines(schedule, payload.previous ?? {}),
        );
      }
      break;
    }
    case EmailNotificationType.schedule_cancelled: {
      const schedule = requireSchedule(payload);
      lines.push(
        paragraph(
          `Buổi phỏng vấn cho vị trí ${jobTitle} tại ${organizationName} lúc ${formatInterviewTime(schedule.startAt, schedule.durationMinutes)} (${interviewTypeLabel(schedule.interviewType)}) đã bị hủy.`,
        ),
      );
      break;
    }
  }

  const clientUrl = options.clientUrl.replace(/\/+$/, '');
  const applicationEmail = type.startsWith('application_');
  const label = applicationEmail ? 'Xem đơn ứng tuyển' : 'Xem lịch phỏng vấn';
  const url = applicationEmail
    ? `${clientUrl}/my-applications/${context.applicationId}`
    : `${clientUrl}/my-interviews`;
  lines.push({
    html: `<p style="margin: 24px 0 0; text-align: center;"><a href="${escapeHtml(url)}" style="display: inline-block; background-color: #0071E3; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 10px;">${escapeHtml(label)}</a></p>`,
    text: `${label}: ${url}`,
  });

  return {
    subject,
    html: fillLayout(options.layout, {
      title: subject,
      contentHtml: lines.map((line) => line.html).join('\n'),
    }),
    text: [
      ...lines.map((line) => line.text),
      'Đây là email tự động, vui lòng không trả lời.',
    ].join('\n\n'),
  };
}

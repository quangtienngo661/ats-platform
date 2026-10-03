import { BadRequestException } from '@nestjs/common';
import { InterviewType } from '@ats-platform/database';

export const LOCATION_MAX_LENGTH = 255;
export const LOCATION_REQUIRED_MESSAGE = 'Phỏng vấn trực tiếp cần địa điểm';
export const LOCATION_TOO_LONG_MESSAGE = 'Địa điểm tối đa 255 ký tự';
export const MEETING_LINK_INVALID_MESSAGE = 'Phỏng vấn trực tuyến cần đường dẫn http(s) hợp lệ';

/** class-transformer helper: trims strings so validation sees what will be stored. */
export const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** The global ValidationPipe does not transform the body, so the service trims too. */
export function trimToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export interface InterviewPlace {
  interviewType: InterviewType;
  location: string | null;
  onlineMeetingLink: string | null;
}

/**
 * Merges a requested change into the schedule's current type, location and link.
 * Only the field that belongs to the resulting type survives (online → link, onsite →
 * location), and that field must be present.
 */
export function resolveInterviewPlace(
  current: InterviewPlace,
  change: Partial<Record<keyof InterviewPlace, string | null | undefined>>,
): InterviewPlace {
  const interviewType = (change.interviewType ?? current.interviewType) as InterviewType;
  const location =
    change.location !== undefined ? trimToNull(change.location) : current.location;
  const onlineMeetingLink =
    change.onlineMeetingLink !== undefined
      ? trimToNull(change.onlineMeetingLink)
      : current.onlineMeetingLink;

  if (interviewType === InterviewType.onsite) {
    if (!location) throw new BadRequestException(LOCATION_REQUIRED_MESSAGE);
    return { interviewType, location, onlineMeetingLink: null };
  }

  if (!onlineMeetingLink) throw new BadRequestException(MEETING_LINK_INVALID_MESSAGE);
  return { interviewType, location: null, onlineMeetingLink };
}

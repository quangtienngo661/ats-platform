import { InterviewType } from '@ats-platform/database';
import { Transform } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsString,
    IsUrl,
    IsUUID,
    Max,
    MaxLength,
    Min,
    ValidateIf,
} from 'class-validator';
import {
    LOCATION_MAX_LENGTH,
    LOCATION_REQUIRED_MESSAGE,
    LOCATION_TOO_LONG_MESSAGE,
    MEETING_LINK_INVALID_MESSAGE,
    trimString,
} from '../interview-schedule.rules';

export class CreateInterviewScheduleDto {
    @IsUUID()
    applicationId: string;

    @IsUUID()
    interviewerId: string;

    @IsEnum(InterviewType)
    interviewType: InterviewType;

    @IsDateString()
    startAt: string;

    @IsInt()
    @Min(15)
    @Max(480)
    durationMinutes: number;

    // Checked only for an online interview; for an onsite one the link is not stored.
    @ValidateIf((dto: CreateInterviewScheduleDto) => dto.interviewType === InterviewType.online)
    @Transform(trimString)
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: MEETING_LINK_INVALID_MESSAGE })
    onlineMeetingLink?: string;

    // Checked only for an onsite interview; for an online one the location is not stored.
    @ValidateIf((dto: CreateInterviewScheduleDto) => dto.interviewType === InterviewType.onsite)
    @Transform(trimString)
    @IsString({ message: LOCATION_REQUIRED_MESSAGE })
    @IsNotEmpty({ message: LOCATION_REQUIRED_MESSAGE })
    @MaxLength(LOCATION_MAX_LENGTH, { message: LOCATION_TOO_LONG_MESSAGE })
    location?: string;
}

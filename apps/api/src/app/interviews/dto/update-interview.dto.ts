import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, MaxLength, Min } from 'class-validator';
import {
    LOCATION_MAX_LENGTH,
    LOCATION_TOO_LONG_MESSAGE,
    MEETING_LINK_INVALID_MESSAGE,
    trimString,
} from '../interview-schedule.rules';

// Format only: whether a link or a location is required depends on the schedule's
// resulting type, which the service decides after merging (resolveInterviewPlace).
export class UpdateInterviewScheduleDto {
    @IsUUID()
    @IsOptional()
    interviewerId?: string;

    @IsEnum(InterviewType)
    @IsOptional()
    interviewType?: InterviewType;

    @IsDateString()
    @IsOptional()
    startAt?: string;

    @IsInt()
    @Min(15)
    @Max(480)
    @IsOptional()
    durationMinutes?: number;

    @Transform(trimString)
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: MEETING_LINK_INVALID_MESSAGE })
    @IsOptional()
    onlineMeetingLink?: string;

    @Transform(trimString)
    @IsString()
    @MaxLength(LOCATION_MAX_LENGTH, { message: LOCATION_TOO_LONG_MESSAGE })
    @IsOptional()
    location?: string;

    @IsEnum(ScheduleStatus)
    @IsOptional()
    status?: ScheduleStatus;
}

import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, MaxLength, Min, ValidateIf } from 'class-validator';
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

    // An empty string clears an external link, so the interview falls back to its built-in room.
    @Transform(trimString)
    @ValidateIf((dto: UpdateInterviewScheduleDto) => !!dto.onlineMeetingLink)
    @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: MEETING_LINK_INVALID_MESSAGE })
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

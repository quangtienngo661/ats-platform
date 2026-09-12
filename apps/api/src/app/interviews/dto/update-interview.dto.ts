import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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

    @IsString()
    @IsOptional()
    onlineMeetingLink?: string;

    @IsEnum(ScheduleStatus)
    @IsOptional()
    status?: ScheduleStatus;
}

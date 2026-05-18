import { InterviewType, ScheduleStatus } from '@ats-platform/database';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateInterviewScheduleDto {
    @IsUUID()
    @IsOptional()
    interviewerId?: string;

    @IsEnum(InterviewType)
    @IsOptional()
    interviewType?: InterviewType;

    @IsDateString()
    @IsOptional()
    scheduledDate?: string;

    @IsDateString()
    @IsOptional()
    scheduledTime?: string;

    @IsString()
    @IsOptional()
    onlineMeetingLink?: string;

    @IsEnum(ScheduleStatus)
    @IsOptional()
    status?: ScheduleStatus;
}

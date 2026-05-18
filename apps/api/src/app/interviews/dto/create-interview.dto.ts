import { InterviewType } from '@ats-platform/database';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInterviewScheduleDto {
    @IsUUID()
    applicationId: string;

    @IsUUID()
    interviewerId: string;

    @IsEnum(InterviewType)
    interviewType: InterviewType;

    @IsDateString()
    scheduledDate: string;

    @IsDateString()
    scheduledTime: string;

    @IsString()
    @IsOptional()
    onlineMeetingLink?: string;
}

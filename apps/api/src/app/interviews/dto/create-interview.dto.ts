import { InterviewType } from '@ats-platform/database';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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

    @IsString()
    @IsOptional()
    onlineMeetingLink?: string;
}

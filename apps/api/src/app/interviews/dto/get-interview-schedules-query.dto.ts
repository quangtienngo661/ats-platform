import { ScheduleStatus } from '@ats-platform/database';
import { IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetInterviewSchedulesQueryDto {
    @IsOptional()
    @IsUUID()
    applicationId?: string;

    @IsOptional()
    @IsEnum(ScheduleStatus)
    status?: ScheduleStatus;

    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @IsOptional()
    @IsDateString()
    toDate?: string;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    limit?: number;

    /** Sort by start time; `desc` lists the latest first (a candidate's history). */
    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc';
}
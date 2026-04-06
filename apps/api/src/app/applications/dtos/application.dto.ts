import { ApplicationStatus } from '@ats-platform/database';
import {
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class CreateApplicationDto {
    @IsUUID()
    jobId: string;

    @IsUUID()
    cvId: string;
}

export class UpdateApplicationStatusDto {
    @IsEnum(ApplicationStatus)
    status: ApplicationStatus;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    rejectionReason?: string;
}

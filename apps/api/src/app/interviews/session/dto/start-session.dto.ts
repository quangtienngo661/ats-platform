import { DifficultyLevel } from '@ats-platform/database';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class StartSessionDto {
    @IsUUID()
    topicId: string;

    @IsEnum(DifficultyLevel)
    difficultyLevel: DifficultyLevel;

    @IsString()
    @IsOptional()
    candidateContext?: string;
}

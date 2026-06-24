import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInterviewTopicDto {
    @IsString()
    name: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string | null;
}
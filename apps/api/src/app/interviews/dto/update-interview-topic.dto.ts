import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateInterviewTopicDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string | null;
}
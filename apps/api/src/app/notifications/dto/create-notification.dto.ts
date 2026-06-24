import { NotificationType, RelatedEntityType } from '@ats-platform/database';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNotificationDto {
    @IsUUID()
    userId: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsUUID()
    @IsOptional()
    relatedEntityId?: string;

    @IsEnum(RelatedEntityType)
    @IsOptional()
    relatedEntityType?: RelatedEntityType;
}

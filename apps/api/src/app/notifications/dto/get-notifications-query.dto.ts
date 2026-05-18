import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetNotificationsQueryDto {
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isRead?: boolean;

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
}

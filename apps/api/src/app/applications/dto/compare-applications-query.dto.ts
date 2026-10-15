import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CompareApplicationsQueryDto {
  @ApiProperty({ type: [String], minItems: 2, maxItems: 4, uniqueItems: true })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((part) => part.trim()) : value,
  )
  @IsArray({ message: 'Danh sách đơn ứng tuyển phải là mảng' })
  @ArrayMinSize(2, { message: 'Chỉ so sánh 2–4 ứng viên của cùng một tin' })
  @ArrayMaxSize(4, { message: 'Chỉ so sánh 2–4 ứng viên của cùng một tin' })
  @ArrayUnique({ message: 'Các đơn ứng tuyển phải khác nhau' })
  @IsUUID('all', { each: true, message: 'Mỗi mã đơn ứng tuyển phải là UUID hợp lệ' })
  applicationIds: string[];
}

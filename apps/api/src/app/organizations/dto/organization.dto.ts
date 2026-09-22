import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Công ty Cổ phần Công nghệ Beta',
    description: 'Tên tổ chức (doanh nghiệp)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: 'beta-tech',
    description: 'Định danh ngắn, duy nhất: chữ thường, số và dấu gạch ngang',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang (vd: beta-tech)',
  })
  @MaxLength(60)
  slug!: string;
}

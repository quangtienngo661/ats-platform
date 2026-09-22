import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IDepartment } from '@ats-platform/types';
import { Department } from '@ats-platform/database';

export class CreateDepartmentDto implements IDepartment {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @ApiProperty({ example: 'Engineering', description: 'The name of the department' })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @ApiProperty({ example: 'Engineering', description: 'The description of the department' })
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @ApiProperty({ example: '#FF9500', description: 'The color of the department' })
  color!: string;

  // Only a platform admin sends this — it belongs to no organization, so it must say
  // which one the department is for. An org_admin or recruiter always gets its own;
  // naming a different one is refused (module spec criterion 7).
  @ApiPropertyOptional({
    example: '00000000-0000-4000-8000-000000000001',
    description: 'Bắt buộc với quản trị viên nền tảng. Người dùng khác nếu gửi thì phải trùng tổ chức của chính mình.',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}

// A department never changes organization: moving it would drag its recruiters and
// postings across the tenant boundary. Sending organizationId here is a 400.
export class UpdateDepartmentDto extends PartialType(
  OmitType(CreateDepartmentDto, ['organizationId'] as const),
) { }

export class DepartmentDto {
  @ApiProperty({
    example: 'a7b0f9f9-2a39-4f2f-ac7a-cf7cb8c3cb2f',
    description: 'Department ID',
  })
  departmentId!: string;

  @ApiProperty({
    example: 'Engineering',
    description: 'The name of the department',
  })
  name!: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'Department creation date',
  })
  createdAt!: Date;

  static fromEntity(entity: Department): DepartmentDto {
    const departmentDto = new DepartmentDto();
    departmentDto.departmentId = entity.departmentId;
    departmentDto.name = entity.name;
    departmentDto.createdAt = entity.createdAt;
    return departmentDto;
  }
}

import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IDepartment } from '@ats-platform/types';
import { Department } from '@ats-platform/database';

export class CreateDepartmentDto implements IDepartment { 
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @ApiProperty({ example: 'Engineering', description: 'The name of the department' })
  name!: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

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

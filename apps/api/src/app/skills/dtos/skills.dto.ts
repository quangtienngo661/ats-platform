import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ISkill } from '@ats-platform/types';
import { Skill } from '@ats-platform/database';

export class CreateSkillDto implements ISkill {
  @ApiProperty({
    example: 'TypeScript',
    description: 'Skill name',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({
    example: 'Programming Language',
    description: 'Skill category',
  })
  @IsOptional()
  @IsString()
  category!: string;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

export class SkillDto {
  @ApiProperty({
    example: 'a7b0f9f9-2a39-4f2f-ac7a-cf7cb8c3cb2f',
    description: 'Skill ID',
  })
  skillId!: string;

  @ApiProperty({
    example: 'TypeScript',
    description: 'Skill name',
  })
  name!: string;

  @ApiPropertyOptional({
    example: 'Programming Language',
    description: 'Skill category',
  })
  category?: string;

  static fromEntity(entity: Skill): SkillDto {
    const skillDto = new SkillDto();
    skillDto.skillId = entity.skillId;
    skillDto.name = entity.name;
    skillDto.category = entity.category;
    return skillDto;
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** The key of the suggestion the recruiter saw; a stale one is refused with 409 (GĐ4 R12). */
export class CopilotDecisionDto {
  @ApiProperty({ example: 'invite_interview:screening:2026-11-18T03:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  key!: string;
}

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class BulkScreeningDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  applicationIds?: string[];

  @IsOptional()
  @IsBoolean()
  moveAppliedToScreening?: boolean;

  @IsOptional()
  @IsUUID()
  configId?: string;
}

import { IsString, MinLength } from 'class-validator';

export class UploadCvDto {
  @IsString()
  @MinLength(3)
  fileName: string;
}
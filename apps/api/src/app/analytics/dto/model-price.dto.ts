import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

const PRICE_MESSAGE = 'Giá phải là số từ 0 đến 100000, tối đa 4 chữ số thập phân';

/** PUT /analytics/ai-model-prices/:modelName — USD per one million tokens (GĐ4 R21). */
export class ModelPriceDto {
  @ApiProperty({ example: 1.25 })
  @IsNumber({ maxDecimalPlaces: 4, allowNaN: false, allowInfinity: false }, { message: PRICE_MESSAGE })
  @Min(0, { message: PRICE_MESSAGE })
  @Max(100000, { message: PRICE_MESSAGE })
  inputUsdPerMillion!: number;

  @ApiProperty({ example: 10 })
  @IsNumber({ maxDecimalPlaces: 4, allowNaN: false, allowInfinity: false }, { message: PRICE_MESSAGE })
  @Min(0, { message: PRICE_MESSAGE })
  @Max(100000, { message: PRICE_MESSAGE })
  outputUsdPerMillion!: number;
}

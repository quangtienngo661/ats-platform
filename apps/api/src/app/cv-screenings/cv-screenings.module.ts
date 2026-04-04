import { Module } from '@nestjs/common';
import { CvScreeningsService } from './cv-screenings.service';
import { CvScreeningsController } from './cv-screenings.controller';

@Module({
  controllers: [CvScreeningsController],
  providers: [CvScreeningsService],
})
export class CvScreeningsModule {}

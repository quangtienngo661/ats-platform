import { Controller } from '@nestjs/common';
import { CvScreeningsService } from './cv-screenings.service';

@Controller('cv-screenings')
export class CvScreeningsController {
  constructor(private readonly cvScreeningsService: CvScreeningsService) {}
}

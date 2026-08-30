import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Kiểm tra tình trạng hệ thống',
    description:
      'Ping thật tới PostgreSQL và Redis. Trả 503 nếu bất kỳ thành phần nào không phản hồi.',
  })
  @ApiResponse({ status: 200, description: 'Hệ thống hoạt động bình thường' })
  @ApiResponse({
    status: 503,
    description: 'Một thành phần phụ thuộc đang lỗi',
  })
  async check(@Res({ passthrough: true }) res: Response) {
    const report = await this.healthService.check();

    // 503, not 200-with-a-sad-body: an orchestrator only reads the status code.
    res.status(
      report.status === 'up' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return report;
  }
}

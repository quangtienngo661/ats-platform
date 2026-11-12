import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@ats-platform/database';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { EmbeddingBackfillService } from './embedding-backfill.service';

@ApiTags('Embedding')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
@Controller('embeddings')
export class EmbeddingBackfillController {
    constructor(private readonly backfillService: EmbeddingBackfillService) {}

    @Post('backfill')
    @ApiOperation({
        summary: 'Tạo embedding còn thiếu',
        description: 'Đưa các dòng chưa có embedding (kỹ năng, CV đã bóc tách) vào hàng đợi. Mỗi lần chạy tối đa 500 dòng mỗi bảng; chạy lại khi hàng đợi đã xong để lấy phần còn lại. Mỗi dòng là một lời gọi OpenAI.',
    })
    @ApiResponse({ status: 201, description: 'Số dòng đã đưa vào hàng đợi' })
    @ApiResponse({ status: 403, description: 'Chỉ quản trị viên hệ thống' })
    async backfill() {
        return { enqueued: await this.backfillService.enqueueMissing() };
    }
}

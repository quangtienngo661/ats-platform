import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@ats-platform/database';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentCaller } from '../../../common/decorators/current-caller.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { TenantCaller } from '../../../common/tenancy/tenant-caller';
import {
    CreateInterviewQuestionDto,
    ListInterviewQuestionsQueryDto,
    UpdateInterviewQuestionDto,
} from './dto/interview-question.dto';
import { InterviewQuestionsService } from './interview-questions.service';

@ApiTags('Ngân hàng câu hỏi phỏng vấn')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.admin)
@Controller('interviews')
export class InterviewQuestionsController {
    constructor(private readonly questionsService: InterviewQuestionsService) {}

    @Get('topics/:topicId/questions')
    @ApiOperation({ summary: 'Danh sách câu hỏi của một chủ đề', description: 'Lọc theo độ khó; mặc định chỉ câu hỏi đang hiện, includeInactive=true để xem cả câu đã ẩn.' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy chủ đề phỏng vấn' })
    list(@Param('topicId') topicId: string, @Query() query: ListInterviewQuestionsQueryDto) {
        return this.questionsService.list(topicId, query);
    }

    @Post('topics/:topicId/questions')
    @ApiOperation({ summary: 'Thêm câu hỏi vào chủ đề' })
    @ApiResponse({ status: 201, description: 'Đã tạo' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy chủ đề phỏng vấn' })
    create(
        @CurrentCaller() caller: TenantCaller,
        @Param('topicId') topicId: string,
        @Body() dto: CreateInterviewQuestionDto,
    ) {
        return this.questionsService.create(topicId, dto, caller.userId);
    }

    @Patch('questions/:questionId')
    @ApiOperation({ summary: 'Sửa hoặc ẩn/hiện câu hỏi' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy câu hỏi phỏng vấn' })
    update(@Param('questionId') questionId: string, @Body() dto: UpdateInterviewQuestionDto) {
        return this.questionsService.update(questionId, dto);
    }

    @Delete('questions/:questionId')
    @ApiOperation({ summary: 'Ẩn câu hỏi', description: 'Không xoá dòng: đặt isActive = false để các phiên cũ vẫn giữ tham chiếu.' })
    @ApiResponse({ status: 200, description: 'Đã ẩn' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy câu hỏi phỏng vấn' })
    remove(@Param('questionId') questionId: string) {
        return this.questionsService.remove(questionId);
    }
}

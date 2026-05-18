import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { InterviewsService } from './interviews.service';
import { InterviewSessionService } from './session/interview-session.service';
import { CreateInterviewScheduleDto } from './dto/create-interview.dto';
import { UpdateInterviewScheduleDto } from './dto/update-interview.dto';
import { GetInterviewSchedulesQueryDto } from './dto/get-interview-schedules-query.dto';
import { CreateInterviewTopicDto } from './dto/create-interview-topic.dto';
import { UpdateInterviewTopicDto } from './dto/update-interview-topic.dto';
import { StartSessionDto } from './session/dto/start-session.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';

@ApiTags('Phỏng vấn')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('interviews')
export class InterviewsController {
    constructor(
        private readonly interviewsService: InterviewsService,
        private readonly interviewSessionService: InterviewSessionService,
    ) { }

    // ── Lịch phỏng vấn ──────────────────────────────────────────

    @Roles(UserRole.recruiter, UserRole.admin)
    @Post('schedules')
    @ApiOperation({ summary: 'Tạo lịch phỏng vấn', description: 'Nhà tuyển dụng tạo lịch phỏng vấn cho ứng viên, chỉ định người phỏng vấn và thời gian.' })
    @ApiResponse({ status: 201, description: 'Tạo thành công' })
    createSchedule(@Req() req: Request, @Body() dto: CreateInterviewScheduleDto) {
        return this.interviewsService.createSchedule(req.user['userId'], req.user['role'], dto);
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Get('schedules/my')
    @ApiOperation({ summary: 'Lịch phỏng vấn của tôi', description: 'Lấy danh sách lịch phỏng vấn liên quan đến người dùng hiện tại.' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    getMySchedules(@Req() req: Request, @Query() query: GetInterviewSchedulesQueryDto) {
        return this.interviewsService.getMySchedules(req.user['userId'], req.user['role'], query);
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Get('schedules/:id')
    @ApiOperation({ summary: 'Chi tiết lịch phỏng vấn' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy lịch phỏng vấn' })
    getScheduleById(@Param('id') id: string, @Req() req: Request) {
        return this.interviewsService.getScheduleById(id, req.user['userId'], req.user['role']);
    }

    @Roles(UserRole.recruiter, UserRole.admin)
    @Patch('schedules/:id')
    @ApiOperation({ summary: 'Cập nhật lịch phỏng vấn' })
    @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
    updateSchedule(
        @Param('id') id: string,
        @Req() req: Request,
        @Body() dto: UpdateInterviewScheduleDto,
    ) {
        return this.interviewsService.updateSchedule(id, req.user['userId'], req.user['role'], dto);
    }

    @Roles(UserRole.recruiter, UserRole.admin)
    @Delete('schedules/:id')
    @ApiOperation({ summary: 'Xóa lịch phỏng vấn' })
    @ApiResponse({ status: 200, description: 'Xóa thành công' })
    removeSchedule(@Param('id') id: string, @Req() req: Request) {
        return this.interviewsService.removeSchedule(id, req.user['userId'], req.user['role']);
    }

    // ── Chủ đề phỏng vấn ────────────────────────────────────────

    @Roles(UserRole.admin)
    @Post('topics')
    @ApiOperation({ summary: 'Tạo chủ đề phỏng vấn', description: 'Admin tạo chủ đề mới cho phỏng vấn AI.' })
    @ApiResponse({ status: 201, description: 'Tạo thành công' })
    createTopic(@Body() dto: CreateInterviewTopicDto) {
        return this.interviewsService.createTopic(dto);
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Get('topics')
    @ApiOperation({ summary: 'Lấy danh sách chủ đề' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    findAllTopics() {
        return this.interviewsService.findAllTopics();
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Get('topics/:id')
    @ApiOperation({ summary: 'Chi tiết chủ đề' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy chủ đề' })
    findTopicById(@Param('id') id: string) {
        return this.interviewsService.findTopicById(id);
    }

    @Roles(UserRole.admin)
    @Patch('topics/:id')
    @ApiOperation({ summary: 'Cập nhật chủ đề' })
    @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
    updateTopic(@Param('id') id: string, @Body() dto: UpdateInterviewTopicDto) {
        return this.interviewsService.updateTopic(id, dto);
    }

    @Roles(UserRole.admin)
    @Delete('topics/:id')
    @ApiOperation({ summary: 'Xóa chủ đề' })
    @ApiResponse({ status: 200, description: 'Xóa thành công' })
    removeTopic(@Param('id') id: string) {
        return this.interviewsService.removeTopic(id);
    }

    @Roles(UserRole.candidate)
    @Post('sessions')
    @ApiOperation({ summary: 'Bắt đầu phỏng vấn AI', description: 'Khởi tạo phiên phỏng vấn AI: sinh 10 câu hỏi theo chủ đề và độ khó. Trả về sessionId để join Socket room.' })
    @ApiResponse({ status: 201, description: 'Khởi tạo thành công' })
    @ApiResponse({ status: 400, description: 'AI không tạo đủ câu hỏi' })
    startSession(@Req() req: Request, @Body() dto: StartSessionDto) {
        return this.interviewSessionService.startSession(req.user['userId'], dto);
    }

    @Roles(UserRole.candidate)
    @Get('sessions/resume')
    @ApiOperation({ summary: 'Tiếp tục phỏng vấn', description: 'Kiểm tra phiên đang dở dang. Dùng khi ứng viên reconnect sau khi mất kết nối.' })
    @ApiResponse({ status: 200, description: 'Trả về session và câu hỏi hiện tại, hoặc null' })
    resumeSession(@Req() req: Request) {
        return this.interviewSessionService.resumeSession(req.user['userId']);
    }

    @Roles(UserRole.candidate)
    @Patch('sessions/:id/abandon')
    @ApiOperation({ summary: 'Hủy phiên phỏng vấn', description: 'Hủy phiên phỏng vấn đang diễn ra để bắt đầu phiên mới.' })
    @ApiResponse({ status: 200, description: 'Hủy thành công' })
    @ApiResponse({ status: 400, description: 'Chỉ hủy được phiên đang diễn ra' })
    abandonSession(@Param('id') id: string, @Req() req: Request) {
        return this.interviewSessionService.abandonSession(id, req.user['userId']);
    }

    @Roles(UserRole.candidate)
    @Get('sessions/my')
    @ApiOperation({ summary: 'Lịch sử phỏng vấn AI', description: 'Danh sách tóm tắt các phiên phỏng vấn AI đã thực hiện, sắp xếp mới nhất trước.' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    getMySessions(@Req() req: Request) {
        return this.interviewsService.getMySessions(req.user['userId']);
    }

    @Roles(UserRole.candidate)
    @Get('sessions/:id')
    @ApiOperation({ summary: 'Chi tiết phiên phỏng vấn' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy phiên phỏng vấn' })
    getInterviewById(@Param('id') id: string, @Req() req: Request) {
        return this.interviewsService.getSessionById(id, req.user['userId']);
    }

    @Roles(UserRole.candidate)
    @Get('sessions/:id/result')
    @ApiOperation({ summary: 'Kết quả phỏng vấn AI', description: 'Lấy kết quả phỏng vấn sau khi phiên hoàn thành: điểm tổng, điểm mạnh, điểm yếu, kế hoạch cải thiện.' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Chưa có kết quả' })
    getSessionResult(@Param('id') id: string, @Req() req: Request) {
        return this.interviewsService.getSessionResult(id, req.user['userId']);
    }
}

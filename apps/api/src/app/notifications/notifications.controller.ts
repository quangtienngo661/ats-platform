import {
    Controller,
    Get,
    Patch,
    Param,
    Delete,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@ats-platform/database';

@ApiTags('Thông báo')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách thông báo', description: 'Lấy thông báo của người dùng hiện tại. Hỗ trợ phân trang và lọc theo trạng thái đọc.' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    findAll(@Req() req: Request, @Query() query: GetNotificationsQueryDto) {
        return this.notificationsService.findAll(req.user['userId'], query);
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Get('unread-count')
    @ApiOperation({ summary: 'Đếm thông báo chưa đọc' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    getUnreadCount(@Req() req: Request) {
        return this.notificationsService.getUnreadCount(req.user['userId']);
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Patch('read-all')
    @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    markAllAsRead(@Req() req: Request) {
        return this.notificationsService.markAllAsRead(req.user['userId']);
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Patch(':id/read')
    @ApiOperation({ summary: 'Đánh dấu đã đọc', description: 'Đánh dấu một thông báo cụ thể là đã đọc.' })
    @ApiResponse({ status: 200, description: 'Thành công' })
    markAsRead(@Param('id') id: string, @Req() req: Request) {
        return this.notificationsService.markAsRead(id, req.user['userId']);
    }

    @Roles(UserRole.candidate, UserRole.recruiter, UserRole.admin)
    @Delete(':id')
    @ApiOperation({ summary: 'Xóa thông báo' })
    @ApiResponse({ status: 200, description: 'Xóa thành công' })
    remove(@Param('id') id: string, @Req() req: Request) {
        return this.notificationsService.remove(id, req.user['userId']);
    }
}

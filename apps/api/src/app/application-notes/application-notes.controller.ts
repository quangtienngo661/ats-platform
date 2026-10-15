import { UserRole } from '@ats-platform/database';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentCaller } from '../../common/decorators/current-caller.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantCaller } from '../../common/tenancy/tenant-caller';
import { ApplicationNotesService } from './application-notes.service';
import { ListNotesQueryDto, NoteDto } from './dto/note.dto';

@ApiTags('Ghi chú ứng viên')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class ApplicationNotesController {
  constructor(private readonly notesService: ApplicationNotesService) {}

  @Roles(UserRole.recruiter, UserRole.admin)
  @Post('applications/:applicationId/notes')
  @ApiOperation({ summary: 'Thêm ghi chú cho đơn ứng tuyển' })
  @ApiResponse({ status: 201, description: 'Thêm ghi chú thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền thêm ghi chú' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn ứng tuyển' })
  create(
    @CurrentCaller() caller: TenantCaller,
    @Param('applicationId') applicationId: string,
    @Body() dto: NoteDto,
  ) {
    return this.notesService.create(caller, applicationId, dto);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Get('applications/:applicationId/notes')
  @ApiOperation({ summary: 'Danh sách ghi chú của đơn ứng tuyển' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền đọc ghi chú' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn ứng tuyển' })
  list(
    @CurrentCaller() caller: TenantCaller,
    @Param('applicationId') applicationId: string,
    @Query() query: ListNotesQueryDto,
  ) {
    return this.notesService.list(caller, applicationId, query);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Patch('application-notes/:id')
  @ApiOperation({ summary: 'Cập nhật ghi chú của tác giả' })
  @ApiResponse({ status: 200, description: 'Cập nhật ghi chú thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền sửa ghi chú' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghi chú' })
  update(
    @CurrentCaller() caller: TenantCaller,
    @Param('id') noteId: string,
    @Body() dto: NoteDto,
  ) {
    return this.notesService.update(caller, noteId, dto);
  }

  @Roles(UserRole.recruiter, UserRole.admin)
  @Delete('application-notes/:id')
  @ApiOperation({ summary: 'Xoá ghi chú của tác giả' })
  @ApiResponse({ status: 200, description: 'Xoá ghi chú thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền xoá ghi chú' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ghi chú' })
  remove(
    @CurrentCaller() caller: TenantCaller,
    @Param('id') noteId: string,
  ) {
    return this.notesService.remove(caller, noteId);
  }
}

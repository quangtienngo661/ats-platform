import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserRole } from '@ats-platform/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, UserDto } from './dtos/user.dto';

@ApiTags('Người dùng')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin cá nhân', description: 'Trả về thông tin của người dùng đang đăng nhập.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async getMe(@Req() req: Request & { user: { userId: string } }) {
    const user = await this.usersService.findOne(req.user.userId);
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân', description: 'Cập nhật họ tên, số điện thoại của người dùng hiện tại.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateMe(req.user.userId, updateUserDto);
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu', description: 'Đổi mật khẩu bằng cách cung cấp mật khẩu cũ và mới.' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu cũ không đúng' })
  async changePassword(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo người dùng mới', description: 'Admin tạo tài khoản mới với vai trò chỉ định.' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.create(createUserDto);
    return newUser;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách người dùng', description: 'Admin xem tất cả người dùng trong hệ thống.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  async findAll() {
    const users = await this.usersService.findAll();
    return users;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem chi tiết người dùng', description: 'Admin xem thông tin chi tiết một người dùng.' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật người dùng', description: 'Admin cập nhật thông tin một người dùng.' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return user;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa người dùng', description: 'Admin xóa một người dùng khỏi hệ thống.' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  async remove(@Param('id') id: string) {
    const user = await this.usersService.remove(id);
    return user;
  }
}

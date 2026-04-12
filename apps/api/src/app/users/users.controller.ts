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
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { successResponse } from '@ats-platform/types';
import { UserRole } from '@ats-platform/database';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, UserDto } from './dtos/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string } }) {
    const user = await this.usersService.findOne(req.user.userId);
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateMe(req.user.userId, updateUserDto);
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/change-password')
  async changePassword(
    @Req() req: Request & { user: { userId: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.create(createUserDto);
    return newUser;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return user;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.admin)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.usersService.remove(id);
    return user;
  }
}

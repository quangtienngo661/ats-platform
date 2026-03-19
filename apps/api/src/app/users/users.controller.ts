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
import { Role, successResponse } from '@ats-platform/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Request } from 'express';
import { CreateUserDto, UpdateUserDto, UserDto } from './dtos/user.dto';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';

@Controller('users')
@UseInterceptors(TransformInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string } }): Promise<UserDto> {
    const user = await this.usersService.findOne(req.user.userId);
    return UserDto.fromEntity(user);
    // return {
    //   // give me a seed user
    //   userId: '550e8400-e29b-41d4-a716-446655440000',
    //   email: 'seeduser@example.com',
    //   fullName: 'Seed User',
    //   phoneNumber: '+84901234567',
    //   status: 'ACTIVE',
    //   role: Role.CANDIDATE,
    //   createdAt: new Date(),
    // }; // Placeholder, sẽ được xử lý bởi TransformInterceptor
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateMe(req.user.userId, updateUserDto);
    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.create(createUserDto);
    return successResponse(201, "User created successfully", newUser);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return successResponse(200, 'Users fetched successfully', users);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return successResponse(200, 'User fetched successfully', user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return successResponse(200, 'User updated successfully', user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.usersService.remove(id);
    return successResponse(200, 'User deleted successfully', user);
  }
}

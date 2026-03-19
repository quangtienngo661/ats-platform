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
// @UseInterceptors(TransformInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Req() req: Request & { user: { userId: string } }): Promise<UserDto> {
    const user = await this.usersService.findOne(req.user.userId);
    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateMe(
    @Req() req: Request & { user: { userId: string } },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserDto> {
    const user = await this.usersService.updateMe(req.user.userId, updateUserDto);
    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const newUser = await this.usersService.create(createUserDto);
    return UserDto.fromEntity(newUser);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(): Promise<UserDto[]> {
    const users = await this.usersService.findAll();
    console.log(users.map(user => UserDto.fromEntity(user)))
    return users.map(user => UserDto.fromEntity(user));
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const user = await this.usersService.findOne(id);
    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.usersService.update(id, updateUserDto);
    return UserDto.fromEntity(user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<UserDto> {
    const user = await this.usersService.remove(id);
    return UserDto.fromEntity(user);
  }
}

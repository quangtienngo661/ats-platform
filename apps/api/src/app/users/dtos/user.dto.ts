import { IsEmail, IsEnum, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { UserRole, UserStatus } from '@ats-platform/database';
import { IUserDto } from '@ats-platform/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { User } from '@ats-platform/database';

export class CreateUserDto implements IUserDto {
    @ApiProperty({
        example: 'candidate@example.com',
        description: 'User email',
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        example: 'StrongP@ssw0rd',
        description: 'Account password',
    })
    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;

    @ApiProperty({
        example: 'Nguyen Van B',
        description: 'Full name',
    })
    @IsString()
    fullName!: string;

    @ApiPropertyOptional({
        example: '+84901234567',
        description: 'Phone number',
    })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiPropertyOptional({
        enum: UserStatus,
        example: UserStatus.active,
        description: 'User status',
    })
    @IsEnum(UserStatus)
    @IsOptional()
    status!: UserStatus;

    @ApiProperty({
        enum: UserRole,
        example: UserRole.candidate,
        description: 'User role',
    })
    @IsEnum(UserRole)
    role!: UserRole;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }

export class ChangePasswordDto {
    @ApiProperty({
        example: 'OldP@ssw0rd',
        description: 'Current account password for verification',
    })
    @IsString()
    currentPassword!: string;

    @ApiProperty({
        example: 'NewStrongP@ssw0rd1',
        description: 'New account password',
    })
    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    newPassword!: string;
}

export class UserDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'User ID',
    })
    userId!: string;

    @ApiProperty({
        example: 'candidate@example.com',
        description: 'User email',
    })
    email!: string;

    @ApiProperty({
        example: 'Nguyen Van B',
        description: 'Full name',
    })
    fullName!: string;

    @ApiPropertyOptional({
        example: '+84901234567',
        description: 'Phone number',
    })
    phoneNumber?: string;

    @ApiProperty({
        enum: ['candidate', 'hr', 'admin'],
        example: 'candidate',
        description: 'User role',
    })
    role!: string;

    @ApiProperty({
        enum: ['active', 'inactive'],
        example: 'active',
        description: 'User status',
    })
    status!: string;

    @ApiProperty({
        example: new Date().toISOString(),
        description: 'Account creation date',
    })
    createdAt!: Date;

    static fromEntity(entity: User): UserDto {
        const userDto = new UserDto();
        userDto.userId = entity.userId;
        userDto.email = entity.email;
        userDto.fullName = entity.fullName;
        userDto.phoneNumber = entity.phoneNumber;
        userDto.role = entity.role;
        userDto.status = entity.status;
        userDto.createdAt = entity.createdAt;
        return userDto;
    }
}
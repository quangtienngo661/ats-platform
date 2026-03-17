import { IsEmail, IsEnum, IsOptional, IsString, IsStrongPassword } from 'class-validator';
import { Role, UserStatus } from '@ats-platform/types';
import { IUserDto } from '@ats-platform/types';
import { PartialType } from '@nestjs/swagger';

export class CreateUserDto implements IUserDto {
    @IsEmail()
    email!: string;

    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;

    @IsString()
    fullName!: string;

    @IsEnum(UserStatus)
    @IsOptional()
    status!: UserStatus;

    @IsEnum(Role)
    role!: Role;
}

export class UpdateUserDto extends PartialType(CreateUserDto) { }
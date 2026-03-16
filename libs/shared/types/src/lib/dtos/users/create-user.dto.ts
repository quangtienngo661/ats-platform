import { IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';
import { Role, UserStatus } from '../../enums';
import { Optional } from '@nestjs/common';

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;

    @IsString()
    fullName!: string;

    @IsEnum(UserStatus)
    @Optional()
    status!: UserStatus;

    @IsEnum(Role)
    role!: Role;
}


import { IsEmail, IsString, IsStrongPassword } from "class-validator";
import { IAuthDto } from "@ats-platform/types";

export class LoginDto implements IAuthDto {
    @IsEmail()
    email!: string;

    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;
}

export class RegisterDto implements IAuthDto {
    @IsEmail()
    email!: string;

    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;

    @IsString()
    fullName!: string;
}

export class RequestEmailVerificationDto implements IAuthDto {
    @IsEmail()
    email!: string;
}

export class VerifyEmailDto {
    @IsString()
    token!: string;
}

import { IsEmail, IsString, IsStrongPassword } from "class-validator";

export class LoginDto {
    @IsEmail()
    email!: string;

    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;
}

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;

    @IsString()
    fullName!: string;
}

export class RequestEmailVerificationDto {
    @IsEmail()
    email!: string;
}

export class VerifyEmailDto {
    @IsString()
    token!: string;
}

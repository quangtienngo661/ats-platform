import { IsEmail, IsEnum, IsString, IsStrongPassword } from "class-validator";
import { IAuth } from "@ats-platform/types";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto implements IAuth {
    @ApiProperty({
        example: "recruiter@example.com",
        description: "User email",
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        example: "StrongP@ssw0rd",
        description: "Account password",
    })
    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;
}

export class RegisterDto implements IAuth {
    @ApiProperty({
        example: "recruiter@example.com",
        description: "User email",
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        example: "StrongP@ssw0rd",
        description: "Account password",
    })
    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;

    @ApiProperty({
        example: "Nguyen Van A",
        description: "Full name",
    })
    @IsString()
    fullName!: string;
}

export class RequestEmailVerificationDto implements IAuth {
    @ApiProperty({
        example: "recruiter@example.com",
        description: "Email to receive verification link/code",
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        example: "verify",
        description: "Type of verification",
        enum: ["verify", "reset"],
    })
    @IsEnum(["verify", "reset"])
    type!: string;
}

export class VerifyEmailDto {
    @ApiProperty({
        example: "email_verification_token",
        description: "Verification token",
    })
    @IsString()
    token!: string;
}

export class ForgotPasswordDto {
    @ApiProperty({
        example: "user@example.com",
        description: "User email to receive password reset link",
    })
    @IsEmail()
    email!: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        example: "reset_token_here",
        description: "Password reset token",
    })
    @IsString()
    token!: string;

    @ApiProperty({
        example: "StrongP@ssw0rd",
        description: "New account password",
    })
    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
    password!: string;
}

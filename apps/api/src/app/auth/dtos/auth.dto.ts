import { IsEmail, IsString, IsStrongPassword } from "class-validator";
import { IAuthDto } from "@ats-platform/types";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto implements IAuthDto {
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

export class RegisterDto implements IAuthDto {
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

export class RequestEmailVerificationDto implements IAuthDto {
    @ApiProperty({
        example: "recruiter@example.com",
        description: "Email to receive verification link/code",
    })
    @IsEmail()
    email!: string;
}

export class VerifyEmailDto {
    @ApiProperty({
        example: "email_verification_token",
        description: "Verification token",
    })
    @IsString()
    token!: string;
}

export class AuthDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'User ID',
    })
    userId!: string;

    @ApiProperty({
        example: 'recruiter@example.com',
        description: 'User email',
    })
    email!: string;

    @ApiProperty({
        example: 'Nguyen Van A',
        description: 'Full name',
    })
    fullName!: string;

    @ApiProperty({
        enum: ['candidate', 'hr', 'admin'],
        example: 'hr',
        description: 'User role',
    })
    role!: string;

    @ApiProperty({
        example: new Date().toISOString(),
        description: 'Account creation date',
    })
    createdAt!: Date;
}

import { UserRole, UserStatus } from "@ats-platform/database";
import { IUserDto } from "@ats-platform/types";

/** DTO phản hồi từ API (đầu ra) */
export interface IUserResponseDto extends IUserDto {
    userId: string;
    email: string;
    fullName: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
}
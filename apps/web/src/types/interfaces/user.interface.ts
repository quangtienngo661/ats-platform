import { UserRole, UserStatus } from "@ats-platform/types";
import { IRecruiter, IUserDto } from "@ats-platform/types";
export interface IUserResponseDto extends IUserDto {
    userId: string;
    email: string;
    fullName: string;
    role: UserRole;
    status: UserStatus;
    createdAt: string;
    recruiter: IRecruiter
}
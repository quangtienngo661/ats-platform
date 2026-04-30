import { IDepartment, IRecruiter } from "@ats-platform/types";
import { UserRole, UserStatus } from "@ats-platform/database";

/** DTO đầu ra từ API cho một Recruiter */
export interface IRecruiterDto extends IRecruiter {
    recruiterId: string;
    userId: string;
    department: IDepartment;
    position?: string;
    user?: {
        fullName: string;
        email: string;
        phoneNumber?: string;
        role: UserRole;
        status: UserStatus;
    };
}

import { IDepartment, IRecruiter } from "@ats-platform/types";
import { UserRole, UserStatus } from "@ats-platform/types";
export interface IRecruiterDto extends IRecruiter {
    recruiterId: string;
    userId: string;
    department: IDepartment;
    position?: string;
    user?: {
        userId?: string;
        fullName: string;
        email: string;
        phoneNumber?: string;
        role: UserRole;
        status: UserStatus;
    };
}
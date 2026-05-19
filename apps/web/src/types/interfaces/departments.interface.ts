import { UserRole, UserStatus } from "@ats-platform/types";
import { IDepartment, IRecruiter } from "@ats-platform/types";

export interface Department extends IDepartment {
    departmentId: string;
    membersCount: number;
    jobPostingsCount: number;
    members: DepartmentMember[];
}

export interface DepartmentMember extends IRecruiter {
    recruiterId: string;
    userId: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    role: UserRole;
    status: UserStatus;
}

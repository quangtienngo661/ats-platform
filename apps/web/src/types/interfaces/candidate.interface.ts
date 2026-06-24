import { ICandidate, UserStatus, IPaginatedResponse } from "@ats-platform/types";

export interface ICandidateDto extends ICandidate {
    candidateId: string;
    userId: string;
    currentTitle?: string;
    yearsOfExperience?: number;
    // profileData?: CvParsedData;
    user?: {
        fullName: string;
        email: string;
        phoneNumber?: string;
        status: UserStatus;
        createdAt: string;
    };
    // Returned by getProfile() / findOne() via _count
    cvCount?: number;
    applicationCount?: number;
}

export interface IFindCandidatesQuery {
    search?: string;
    status?: 'active' | 'inactive';
    page?: number;
    limit?: number;
}

export type IPaginatedCandidates = IPaginatedResponse<ICandidateDto>;

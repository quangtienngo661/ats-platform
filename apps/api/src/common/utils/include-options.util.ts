import { Prisma } from "@ats-platform/database";
import {
  isOrganizationStaff,
  isPlatformAdmin,
  TenantCaller,
} from '../tenancy/tenant-caller';

export const recruiterIncludeOptions = {
  user: {
    omit: { passwordHash: true },
  },
  department: true,
} satisfies Prisma.RecruiterInclude;

export const jobPostingIncludeOptions = {
  category: true,
  recruiter: {
    omit: {
      userId: true,
    },
    include: { ...recruiterIncludeOptions },
  },
  jobPostingSkills: {
    include: {
      skill: true,
    },
    omit: {
      jobId: true,
      skillId: true,
    }
  },
  department: true,
  applications: {
    select: {
      candidate: {
        select: {
          userId: true,
        }
      },
      cvId: true,
      status: true
    }
  }
} satisfies Prisma.JobPostingInclude;

/** Public viewers need only their own application status to decide whether they can apply. */
export function jobPostingIncludeFor(viewer?: TenantCaller) {
  if (viewer && (isPlatformAdmin(viewer.role) || isOrganizationStaff(viewer.role))) {
    return jobPostingIncludeOptions;
  }

  return {
    category: jobPostingIncludeOptions.category,
    department: jobPostingIncludeOptions.department,
    jobPostingSkills: jobPostingIncludeOptions.jobPostingSkills,
    applications: {
      // An empty IN filter matches no candidate for an anonymous visitor.
      where: { candidate: { userId: viewer?.userId ?? { in: [] } } },
      select: {
        status: true,
        candidate: { select: { userId: true } },
      },
    },
  } satisfies Prisma.JobPostingInclude;
}

export const candidateIncludeOptions = {
  user: {
    omit: { passwordHash: true },
  },
  _count: {
    select: {
      cvs: true,
      applications: true
    }
  }
}

export const cvIncludeOptions = {
  candidate: {
    include: { ...candidateIncludeOptions }
  },
} satisfies Prisma.CVInclude;

export const cvParsedDataIncludeOptions = {
  cv: {
    include: { ...cvIncludeOptions }
  },
} satisfies Prisma.CVParsedDataInclude;

export const applicationIncludeOptions = {
  candidate: {
    include: {
      user: { omit: { passwordHash: true } },
    },
    omit: { userId: true },
  },
  jobPosting: {
    omit: {
      parsedRequirements: true,
      description: true,
      departmentId: true,
      categoryId: true,
      createdBy: true,
    },
    include: { department: true }
  },
  cv: {
    omit: {
      rawText: true,
      errorLog: true,
      candidateId: true,
    },
  },
  screening: {
    select: { screeningId: true, status: true, overallScore: true, aiRecommendation: true, skillsScore: true, experienceScore: true, educationScore: true, aiReasoning: true, matchedSkills: true, missingSkills: true },
  },
  history: { orderBy: { changedAt: 'desc' }, take: 1 },
} satisfies Prisma.ApplicationInclude;

export const cvScreeningIncludeOptions = {
  aiConfig: true,
  application: true,
  cv: true,
} satisfies Prisma.CVScreeningInclude;

export const departmentIncludeOptions = {
  recruiters: {
    include: { ...recruiterIncludeOptions },
  },
  jobPostings: true,
} satisfies Prisma.DepartmentInclude;

export const interviewTopicCategorySelect = {
  categoryId: true,
  name: true,
  parentCategoryId: true,
} satisfies Prisma.JobCategorySelect;

export const interviewTopicIncludeOptions = {
  category: { select: interviewTopicCategorySelect },
  _count: { select: { sessions: true } },
} satisfies Prisma.InterviewTopicInclude;

export const scheduleIncludeOptions = {
  application: {
    include: {
      candidate: {
        include: {
          user: { omit: { passwordHash: true } },
        },
        omit: { userId: true },
      },
      jobPosting: {
        omit: {
          parsedRequirements: true,
          description: true,
          departmentId: true,
          categoryId: true,
          createdBy: true,
        },
        include: { department: true },
      },
    },
  },
  interviewer: { omit: { passwordHash: true } },
  scheduler: { omit: { passwordHash: true } },

} satisfies Prisma.InterviewScheduleInclude;

/**
 * What a candidate may see of an interview schedule — and nothing more: no staff
 * e-mail, phone, role or status, no scheduler, no candidate user row. Staff keep
 * `scheduleIncludeOptions`.
 */
export const candidateScheduleSelect = {
  interviewId: true,
  startAt: true,
  durationMinutes: true,
  interviewType: true,
  onlineMeetingLink: true,
  location: true,
  status: true,
  interviewer: { select: { fullName: true } },
  application: {
    select: {
      applicationId: true,
      jobPosting: {
        select: {
          jobId: true,
          title: true,
          organization: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.InterviewScheduleSelect;

/**
 * The application-history columns read for a candidate. `rejectionReason` is read only
 * so `toCandidateHistory` can decide whether to pass it on — never sent as-is.
 * No `notes`, `changedBy` or staff `user`.
 */
export const candidateHistorySelect = {
  id: true,
  fromStatus: true,
  toStatus: true,
  changedAt: true,
  rejectionReason: true,
} satisfies Prisma.ApplicationHistorySelect;

export const sessionIncludeOptions = {
  topic: {
    include: {
      category: { select: interviewTopicCategorySelect },
    },
  },
  qnas: { orderBy: { orderIndex: 'asc' } },
  result: true
} satisfies Prisma.InterviewSessionInclude

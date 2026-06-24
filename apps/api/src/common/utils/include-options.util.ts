import { Prisma } from "@ats-platform/database";

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

export const sessionIncludeOptions = {
  topic: {
    include: {
      category: { select: interviewTopicCategorySelect },
    },
  },
  qnas: { orderBy: { orderIndex: 'asc' } },
  result: true
} satisfies Prisma.InterviewSessionInclude
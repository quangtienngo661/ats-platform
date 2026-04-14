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
  },
  cv: {
    omit: {
      rawText: true,
      errorLog: true,
      candidateId: true,
    },
  },
  screening: true,
};

export const cvScreeningIncludeOptions = {
  aiConfig: true,
  application: true,
  cv: true,
} satisfies Prisma.CVScreeningInclude;
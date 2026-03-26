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


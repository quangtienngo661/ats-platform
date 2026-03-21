import { Prisma } from "@ats-platform/database";

export const recruiterIncludeOptions = {
  user: {
    omit: { passwordHash: true },
  },
  department: true,
} satisfies Prisma.RecruiterInclude;

export const userIncludeOptions = {
  omit: { passwordHash: true },
}

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


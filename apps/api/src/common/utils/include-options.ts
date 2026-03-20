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

export const jobPostingSkillIncludeOptions = {
  jobPosting: {
    select: {
      jobId: true,
      title: true,
    },
  },
  skill: {
    select: {
      skillId: true,
      name: true,
    },
  },
} satisfies Prisma.JobPostingSkillInclude;

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
  },
} satisfies Prisma.JobPostingInclude;


import { Prisma } from "@ats-platform/database";

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
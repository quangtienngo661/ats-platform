import { ISkill } from "@ats-platform/types";

/** DTO đầu ra từ API cho một Skill */
export interface ISkillDto extends ISkill {
    skillId: string;
    name: string;
    // category?: string;
}

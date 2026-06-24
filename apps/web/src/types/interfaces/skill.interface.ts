import { ISkill } from "@ats-platform/types";
export interface ISkillDto extends ISkill {
    skillId: string;
    name: string;
    // category?: string;
}

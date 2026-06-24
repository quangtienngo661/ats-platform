export interface ISkill {
  name: string;
  category: string;
}

export interface IJobPostingSkills extends ISkill {
  skillId: string;
  isRequired: boolean;
}

import { IAiConfig } from "@ats-platform/types";

export interface ConfigProfile extends IAiConfig {
    id: number;
    name: string;
    description: string;
    isDefault: boolean;
    collapsed: boolean;
    skillsWeight: number;
    experienceWeight: number;
    educationWeight: number;
}
// TODO: consider deleting collapsed
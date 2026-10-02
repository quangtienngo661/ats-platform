export interface IAiConfig {
	configId?: string;
	organizationId?: string;
	name: string;
	description?: string
	isDefault: boolean;
	skillsWeight: number;
	experienceWeight: number;
	educationWeight: number;
	minimumScoreThreshold: number;
}



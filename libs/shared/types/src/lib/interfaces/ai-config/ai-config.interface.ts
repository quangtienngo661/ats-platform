export interface IAiConfig {
	configId?: string;
	name: string;
	description?: string
	isDefault: boolean;
	skillsWeight: number;
	experienceWeight: number;
	educationWeight: number;
	minimumScoreThreshold: number;
}



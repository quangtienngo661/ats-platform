import http from '@/lib/http';
import SkillClient from '@/components/skill-management/SkillClient';

export interface SkillDto {
    skillId: string;
    name: string;
    category?: string | null;
}

async function getSkills(): Promise<SkillDto[]> {
    try {
        const data = await http.get('/skills');
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

export default async function SkillManagementPage() {
    const skills = await getSkills();
    return <SkillClient initialSkills={skills} />;
}

import SkillClient from '@/components/skill-management/SkillClient';
import { getSkillsAction } from '@/servers/skills/skills.action';

export default async function SkillManagementPage() {
    const skills = await getSkillsAction();
    return <SkillClient skills={skills} />;
}

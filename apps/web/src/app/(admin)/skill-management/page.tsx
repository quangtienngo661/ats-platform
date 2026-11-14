import { getUiVariant } from '@/lib/ui-variant';
import LegacySkillManagementPage from '@/legacy/app/(admin)/skill-management/page';
import SkillClient from '@/components/skill-management/SkillClient';
import { getSkillsAction } from '@/servers/skills/skills.action';

export default async function SkillManagementPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacySkillManagementPage />;
    const skills = await getSkillsAction();
    return <SkillClient skills={skills} />;
}

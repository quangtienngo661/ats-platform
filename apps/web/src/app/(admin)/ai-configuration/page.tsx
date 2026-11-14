import { getUiVariant } from '@/lib/ui-variant';
import LegacyAIScreeningConfigPage from '@/legacy/app/(admin)/ai-configuration/page';
import AIScreeningConfigClient from '@/components/ai-configuration/AIConfigClient';
import { getAIConfigAction } from '@/servers/ai-config/ai-config.action';
import { getOrganizationOptionsForCurrentUser } from '@/servers/organizations/organizations.action';

export default async function AIScreeningConfigPage() {
  if ((await getUiVariant()) === 'legacy') return <LegacyAIScreeningConfigPage />;
  const [configs, organizations] = await Promise.all([
    getAIConfigAction(),
    getOrganizationOptionsForCurrentUser(),
  ]);

  return (
    <AIScreeningConfigClient profiles={configs} organizations={organizations} />
  );
}
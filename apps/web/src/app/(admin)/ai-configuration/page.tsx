import AIScreeningConfigClient from '@/components/ai-configuration/AIConfigClient';
import { getAIConfigAction } from '@/servers/ai-config/ai-config.action';
import { getOrganizationOptionsForCurrentUser } from '@/servers/organizations/organizations.action';

export default async function AIScreeningConfigPage() {
  const [configs, organizations] = await Promise.all([
    getAIConfigAction(),
    getOrganizationOptionsForCurrentUser(),
  ]);

  return (
    <AIScreeningConfigClient profiles={configs} organizations={organizations} />
  );
}
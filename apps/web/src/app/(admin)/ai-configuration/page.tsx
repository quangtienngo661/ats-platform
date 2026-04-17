import AIScreeningConfigClient from '@/components/ai-configuration/AIConfigClient';
import { getAIConfigAction } from '@/servers/ai-config/ai-config.action';

export default async function AIScreeningConfigPage() {
  const configs = await getAIConfigAction();

  return (
    <AIScreeningConfigClient profiles={configs} />
  );
}
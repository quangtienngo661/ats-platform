import { getUiVariant } from '@/lib/ui-variant';
import LegacyCompanySettingsPage from '@/legacy/app/(admin)/company-profile/page';
import { CompanySettingsClient } from './CompanySettingsClient';

export default async function CompanySettingsPage() {
  if ((await getUiVariant()) === 'legacy') return <LegacyCompanySettingsPage />;

  return <CompanySettingsClient />;
}

import { getUiVariant } from '@/lib/ui-variant';
import LegacyMyApplicationsPage from '@/legacy/app/(candidate)/my-applications/page';
import MyApplicationsClient from '@/components/my-applications/MyApplicationsClient';
import { getMyApplicationsAction } from '@/servers/applications/applications.action';

export default async function MyApplicationsPage() {
    if ((await getUiVariant()) === 'legacy') return <LegacyMyApplicationsPage />;
    const applications = await getMyApplicationsAction();

    return <MyApplicationsClient applications={applications} />;
}

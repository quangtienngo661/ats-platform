import MyApplicationsClient from '@/components/my-applications/MyApplicationsClient';
import { getMyApplicationsAction } from '@/servers/applications/applications.action';

export default async function MyApplicationsPage() {
    const applications = await getMyApplicationsAction();

    return <MyApplicationsClient applications={applications} />;
}

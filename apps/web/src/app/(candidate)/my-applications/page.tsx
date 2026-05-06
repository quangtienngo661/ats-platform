import MyApplicationsClient from '@/components/my-applications/MyApplicationsClient';
import { getMyApplicationsAction } from '@/servers/applications/applications.action';
import { IApplicationDto } from '@/types/interfaces/application.interface';

export default async function MyApplicationsPage() {
    const applications = await getMyApplicationsAction();

    return <MyApplicationsClient applications={applications} />;
}

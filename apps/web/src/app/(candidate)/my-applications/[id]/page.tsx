import { ApplicationDetail } from '@/components/my-applications/ApplicationDetail';
import { getApplicationByIdAction } from '@/servers/applications/applications.action';

// A 403 (another candidate's application) or 404 is thrown by the action and lands on
// the (candidate) error boundary — no data of anyone else is rendered.
export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const application = await getApplicationByIdAction(id);

    return <ApplicationDetail application={application} />;
}

import { getUiVariant } from '@/lib/ui-variant';
import LegacyApplicationPage from '@/legacy/app/(candidate)/my-applications/[id]/page';
import { ApplicationDetail } from '@/components/my-applications/ApplicationDetail';
import { getApplicationByIdAction } from '@/servers/applications/applications.action';

// A 403 (another candidate's application) or 404 is thrown by the action and lands on
// the (candidate) error boundary — no data of anyone else is rendered.
export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    if ((await getUiVariant()) === 'legacy') return <LegacyApplicationPage params={params} />;
    const { id } = await params;
    const application = await getApplicationByIdAction(id);

    return (
        <ApplicationDetail
            application={{
                applicationId: id,
                jobId: application.jobId,
                title: application.jobPosting?.title,
                departmentName: application.jobPosting?.department?.name,
                status: application.status,
                appliedAt: application.appliedAt,
                history: application.history ?? [],
            }}
        />
    );
}

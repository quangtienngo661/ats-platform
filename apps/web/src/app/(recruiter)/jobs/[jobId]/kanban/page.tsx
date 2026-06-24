import { CandidatesHeader } from '@/components/candidates/ui/CandidatesHeader';
import KanbanClient from '@/components/kanban/KanbanClient';
import { getApplicationsByJobAction, getKanbanBoardAction } from '@/servers/applications/applications.action';
import { getAIConfigAction } from '@/servers/ai-config/ai-config.action';
import { KanbanHydrator } from '@/components/hydrators/KanbanHydrator';
import { InitSocketRoom } from '@/components/common/InitSocketRoom';

interface JobKanbanPageProps {
    params: Promise<{ jobId: string }>;
}

export default async function JobKanbanPage({ params }: JobKanbanPageProps) {
    const { jobId } = await params;

    const [kanbanResult, applicationsResult, aiProfiles] = await Promise.all([
        getKanbanBoardAction(jobId),
        getApplicationsByJobAction(jobId, { includeCancelled: true }),
        getAIConfigAction(),
    ]);
    const boardData = kanbanResult.board;
    const applications = applicationsResult.items;
    const cancelledApplications = applications.filter((app) => app.status === 'cancelled');

    return (
        <div className="flex flex-col h-full bg-[#F5F5F7]">
            <KanbanHydrator initialBoard={boardData} initialCancelledApplications={cancelledApplications} />
            <InitSocketRoom jobId={jobId} />
            <CandidatesHeader jobId={jobId} activeView="kanban" />
            <KanbanClient
                jobId={jobId}
                aiProfiles={aiProfiles}
            />
        </div>
    );
}

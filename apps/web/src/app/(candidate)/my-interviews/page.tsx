import { MyInterviewsClient } from '@/components/my-interviews/MyInterviewsClient';
import { getCandidateInterviewSchedulesAction } from '@/servers/interviews/interviews.action';

const HISTORY_PAGE_SIZE = 20;
const UPCOMING_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

function pageFrom(value: string | string[] | undefined): number {
    const page = Number.parseInt(Array.isArray(value) ? value[0] : value ?? '', 10);
    return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function MyInterviewsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const historyPage = pageFrom((await searchParams).page);
    // From yesterday, so an interview still running (or one the recruiter has not closed)
    // is fetched by the upcoming request whatever the server's timezone (C19).
    const fromDate = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);

    // "Xem thêm" grows the history: page n shows the latest n × 20, not only the n-th slice.
    const [upcoming, history] = await Promise.all([
        getCandidateInterviewSchedulesAction({ status: 'scheduled', fromDate, order: 'asc', limit: UPCOMING_LIMIT }),
        getCandidateInterviewSchedulesAction({ order: 'desc', page: 1, limit: HISTORY_PAGE_SIZE * historyPage }),
    ]);

    return (
        <MyInterviewsClient
            upcoming={upcoming.items}
            history={history.items}
            historyPage={historyPage}
            historyTotalPages={Math.ceil(history.pagination.total / HISTORY_PAGE_SIZE)}
        />
    );
}

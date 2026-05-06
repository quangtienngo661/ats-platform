import JobPostingsClient from '@/components/job-postings/JobPostingsClient';
import { mockJobPostings } from '@/mocks/hr-portal';
import { getJobPostingsAction } from '@/servers/job-postings/job-postings.action';

// TODO: replace mock with real fetch
// import { getJobPostingsAction } from '@/servers/job-postings/job-postings.action';

export default async function JobPostingsPage() {
    // TODO: const result = await getJobPostingsAction();
    const result = await getJobPostingsAction();
    // const jobs = result.data ?? [];
    // const jobs = mockJobPostings;

    return <JobPostingsClient jobs={result.data} />;
}

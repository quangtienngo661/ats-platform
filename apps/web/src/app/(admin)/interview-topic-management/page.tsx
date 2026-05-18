import InterviewTopicClient from '@/components/interview-topic-management/InterviewTopicClient';
import { getJobCategoriesAction } from '@/servers/job-categories/job-categories.action';
import { getInterviewTopicsAction } from '@/servers/interviews/interviews.action';

export default async function InterviewTopicManagementPage() {
    const [topics, jobCategories] = await Promise.all([
        getInterviewTopicsAction(),
        getJobCategoriesAction(),
    ]);

    return <InterviewTopicClient topics={topics} jobCategories={jobCategories} />;
}
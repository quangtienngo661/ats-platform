import InterviewResultClient from '@/components/mock-interview/InterviewResultClient';
import InterviewPendingResultClient from '@/components/mock-interview/InterviewPendingResultClient';
import { getInterviewById, getInterviewResultAction } from '@/servers/interviews/interviews.action';
import { notFound } from 'next/navigation';

export const metadata = {
    title: 'Kết quả phỏng vấn | TalentAI',
    description: 'Xem kết quả phỏng vấn AI chi tiết.',
};

export default async function InterviewResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    const result = await getInterviewResultAction(sessionId);

    if (result?.session) {
        return <InterviewResultClient result={result} />;
    }

    const session = await getInterviewById(sessionId);
    if (session?.status === 'pending_result') {
        return (
            <InterviewPendingResultClient
                sessionId={sessionId}
                topicName={session.topic?.name}
            />
        );
    }

    notFound();
}

import { InterviewChatHydrator } from '@/components/hydrators/InterviewChatHydrator';
import InterviewChatClient from '@/components/mock-interview/InterviewChatClient';
import InterviewGeneratingClient from '@/components/mock-interview/InterviewGeneratingClient';
import { getInterviewById, resumeInterviewSessionAction } from '@/servers/interviews/interviews.action';
import { notFound, redirect } from 'next/navigation';

export const metadata = {
    title: 'Phỏng vấn đang diễn ra | TalentAI',
    description: 'Phiên phỏng vấn AI đang diễn ra.',
};

export default async function InterviewChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;

    // [Lỗi #6 Fix] Guard null: nếu không có session in_progress thì 404
    const result = await resumeInterviewSessionAction();
    if (!result || !result.session || !result.currentQuestion || result.session.sessionId !== sessionId) {
        const session = await getInterviewById(sessionId);
        if (session?.status === 'pending_result' || session?.status === 'completed') {
            redirect(`/mock-interview/${sessionId}/result`);
        }

        if (session?.status === 'generating') {
            return <InterviewGeneratingClient sessionId={sessionId} topicName={session.topic?.name ?? ''} />;
        }

        notFound();
    }

    const { session, currentQuestion } = result;

    return (
        <>
            {/* [Lỗi #1 Fix] Truyền currentQuestion (câu đang dở đúng thật) thay vì qnas[0] */}
            <InterviewChatHydrator initialQuestion={currentQuestion} />
            <InterviewChatClient
                sessionId={session.sessionId}
                topicName={session.topic.name ?? ''}
                category={session.topic.category?.name ?? ''}
                difficulty={session.difficultyLevel ?? 'easy'}
                totalQuestions={session.qnas?.length ?? 0}
                initialQuestion={currentQuestion}
                historyQnAs={session.qnas ?? []}
            />
        </>
    );
}

import MockInterviewClient from '@/components/mock-interview/MockInterviewClient';
import { getInterviewTopicsAction, getMySessionsAction } from '@/servers/interviews/interviews.action';

export const metadata = {
    title: 'Phỏng vấn AI | TalentAI',
    description: 'Luyện phỏng vấn kỹ thuật với AI — chọn chủ đề, mức độ và bắt đầu ngay.',
};

export default async function MockInterviewPage() {
    const [topics, history] = await Promise.all([
        getInterviewTopicsAction(),
        getMySessionsAction(),
    ]);


    return <MockInterviewClient topics={topics} history={history} />;
}

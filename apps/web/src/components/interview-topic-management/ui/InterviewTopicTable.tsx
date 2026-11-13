import { IInterviewTopic } from '@/types/interfaces/interview.interface';
import { Table, TBody, TH, THead } from '@/components/ui';
import { InterviewTopicRow } from './InterviewTopicRow';

interface InterviewTopicTableProps {
    topics: IInterviewTopic[];
    onEdit: (topic: IInterviewTopic) => void;
}

/** The list of topics. The caller shows the empty and no-match states, so `topics` is never empty here. */
export function InterviewTopicTable({ topics, onEdit }: InterviewTopicTableProps) {
    return (
        <Table>
            <THead>
                <tr className="border-b border-line">
                    <TH>Chủ đề</TH>
                    <TH className="max-sm:hidden">Danh mục</TH>
                    <TH numeric>Phiên</TH>
                    <TH className="w-px">
                        <span className="sr-only">Thao tác</span>
                    </TH>
                </tr>
            </THead>
            <TBody>
                {topics.map((topic) => (
                    <InterviewTopicRow key={topic.topicId} topic={topic} onEdit={onEdit} />
                ))}
            </TBody>
        </Table>
    );
}

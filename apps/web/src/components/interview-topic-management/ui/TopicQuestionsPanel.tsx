'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { DifficultyLevel } from '@ats-platform/types';
import { AccessibleDialog, DialogContent, DialogOverlay } from '@/components/common/AccessibleDialog';
import { toast } from '@/lib/toast';
import {
    createTopicQuestionAction,
    getTopicQuestionsAction,
    updateTopicQuestionAction,
} from '@/servers/interviews/interview-questions.action';
import { SFT } from '@/types/fonts/fonts';
import type { IInterviewQuestion } from '@/types/interfaces/interview-question.interface';
import type { IInterviewTopic } from '@/types/interfaces/interview.interface';

interface TopicQuestionsPanelProps {
    topic: IInterviewTopic;
    onClose: () => void;
}

const DIFFICULTIES: { value: DifficultyLevel; label: string }[] = [
    { value: DifficultyLevel.easy, label: 'Dễ' },
    { value: DifficultyLevel.medium, label: 'Trung bình' },
    { value: DifficultyLevel.hard, label: 'Khó' },
];

const parsePoints = (text: string) =>
    text.split('\n').map((line) => line.trim()).filter(Boolean);

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((item, index) => item === b[index]);

export function TopicQuestionsPanel({ topic, onClose }: TopicQuestionsPanelProps) {
    const formIds = { difficulty: useId(), text: useId(), points: useId() };
    const [questions, setQuestions] = useState<IInterviewQuestion[] | null>(null);
    const [total, setTotal] = useState(0);
    const [loadFailed, setLoadFailed] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.easy);
    const [text, setText] = useState('');
    const [pointsText, setPointsText] = useState('');
    const [editing, setEditing] = useState<IInterviewQuestion | null>(null);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const result = await getTopicQuestionsAction(topic.topicId);
            setQuestions(result.items);
            setTotal(result.pagination.total);
            setLoadFailed(false);
        } catch (error) {
            unstable_rethrow(error);
            setLoadFailed(true);
        }
    }, [topic.topicId]);

    useEffect(() => {
        void load();
    }, [load]);

    function resetForm() {
        setEditing(null);
        setDifficulty(DifficultyLevel.easy);
        setText('');
        setPointsText('');
    }

    function startEditing(question: IInterviewQuestion) {
        setMessage(null);
        setEditing(question);
        setDifficulty(question.difficulty);
        setText(question.questionText);
        setPointsText(question.expectedPoints.join('\n'));
    }

    async function submit() {
        const questionText = text.trim();
        const expectedPoints = parsePoints(pointsText);
        if (!questionText) return setMessage('Vui lòng nhập nội dung câu hỏi');
        if (expectedPoints.length === 0) return setMessage('Cần ít nhất một ý mong đợi');

        setSaving(true);
        setMessage(null);
        try {
            let result;
            if (editing) {
                const changes = {
                    ...(difficulty !== editing.difficulty ? { difficulty } : {}),
                    ...(questionText !== editing.questionText ? { questionText } : {}),
                    ...(!sameList(expectedPoints, editing.expectedPoints) ? { expectedPoints } : {}),
                };
                if (Object.keys(changes).length === 0) {
                    resetForm();
                    return;
                }
                result = await updateTopicQuestionAction(editing.questionId, changes);
            } else {
                result = await createTopicQuestionAction(topic.topicId, { difficulty, questionText, expectedPoints });
            }

            if (!result.success) return setMessage(result.message);
            toast.success('Thành công', result.message);
            resetForm();
            await load();
        } catch (error) {
            unstable_rethrow(error);
            setMessage('Lưu câu hỏi thất bại. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    }

    async function setActive(question: IInterviewQuestion, isActive: boolean) {
        setMessage(null);
        try {
            const result = await updateTopicQuestionAction(question.questionId, { isActive });
            if (!result.success) return setMessage(result.message);
            setQuestions((current) =>
                current?.map((item) => (item.questionId === question.questionId ? { ...item, isActive } : item)) ?? null,
            );
        } catch (error) {
            unstable_rethrow(error);
            setMessage('Cập nhật câu hỏi thất bại. Vui lòng thử lại.');
        }
    }

    const active = questions?.filter((question) => question.isActive) ?? [];
    const hidden = questions?.filter((question) => !question.isActive) ?? [];

    return (
        <AccessibleDialog onClose={onClose} dismissible={!saving}>
            <DialogOverlay className="fixed inset-0 bg-black/30 z-50" />
            <DialogContent title={`Câu hỏi: ${topic.name}`}>
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl max-h-[88vh] overflow-y-auto bg-white rounded-2xl border border-[#F2F2F7] p-6 shadow-xl"
                    style={{ fontFamily: SFT }}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-[18px] text-[#1D1D1F] font-semibold">Câu hỏi: {topic.name}</h2>
                            <p className="text-[13px] text-[#6E6E73] mt-1">
                                Ngân hàng câu hỏi dùng chung cho mọi tổ chức. Phiên phỏng vấn thử ưu tiên lấy câu từ đây.
                            </p>
                        </div>
                        <button type="button" onClick={onClose} disabled={saving}
                            className="px-3 py-1.5 rounded-xl text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-50">
                            Đóng
                        </button>
                    </div>

                    {message && <p role="alert" className="mb-3 text-[13px] text-[#DC2626]">{message}</p>}
                    {loadFailed && (
                        <p role="alert" className="mb-3 text-[13px] text-[#DC2626]">Không thể tải câu hỏi. Vui lòng thử lại.</p>
                    )}
                    {questions === null && !loadFailed && (
                        <p className="text-[13px] text-[#6E6E73] mb-3">Đang tải câu hỏi…</p>
                    )}

                    {questions !== null && (
                        <div className="space-y-4 mb-6">
                            {total > questions.length && (
                                <p className="text-[12px] text-[#6E6E73]">
                                    Đang hiển thị {questions.length} trên {total} câu hỏi
                                </p>
                            )}
                            {DIFFICULTIES.map(({ value, label }) => (
                                <QuestionGroup key={value} label={label}
                                    questions={active.filter((question) => question.difficulty === value)}
                                    emptyText="Chưa có câu hỏi"
                                    onEdit={startEditing}
                                    action={{ label: 'Ẩn câu hỏi', onClick: (question) => setActive(question, false) }} />
                            ))}
                            {hidden.length > 0 && (
                                <QuestionGroup label="Đã ẩn" questions={hidden} onEdit={startEditing}
                                    action={{ label: 'Hiện lại câu hỏi', onClick: (question) => setActive(question, true) }} />
                            )}
                        </div>
                    )}

                    <form className="border-t border-[#F2F2F7] pt-4 space-y-3"
                        onSubmit={(event) => { event.preventDefault(); void submit(); }}>
                        <h3 className="text-[14px] text-[#1D1D1F] font-semibold">
                            {editing ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}
                        </h3>
                        <div>
                            <label htmlFor={formIds.difficulty} className="block text-[13px] text-[#6E6E73] mb-1.5">Độ khó</label>
                            <select id={formIds.difficulty} value={difficulty} disabled={saving}
                                onChange={(event) => setDifficulty(event.target.value as DifficultyLevel)}
                                className="rounded-xl px-3 py-2 border border-[#E5E5EA] bg-[#F5F5F7] text-[13px] text-[#1D1D1F]">
                                {DIFFICULTIES.map(({ value, label }) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor={formIds.text} className="block text-[13px] text-[#6E6E73] mb-1.5">Câu hỏi</label>
                            <textarea id={formIds.text} value={text} rows={2} maxLength={1000} disabled={saving}
                                onChange={(event) => setText(event.target.value)}
                                className="w-full rounded-xl px-3.5 py-2.5 border border-[#E5E5EA] bg-[#F5F5F7] text-[13px] text-[#1D1D1F]" />
                        </div>
                        <div>
                            <label htmlFor={formIds.points} className="block text-[13px] text-[#6E6E73] mb-1.5">
                                Ý mong đợi (mỗi dòng một ý)
                            </label>
                            <textarea id={formIds.points} value={pointsText} rows={3} disabled={saving}
                                onChange={(event) => setPointsText(event.target.value)}
                                className="w-full rounded-xl px-3.5 py-2.5 border border-[#E5E5EA] bg-[#F5F5F7] text-[13px] text-[#1D1D1F]" />
                        </div>
                        <div className="flex justify-end gap-2">
                            {editing && (
                                <button type="button" onClick={resetForm} disabled={saving}
                                    className="px-4 py-2 rounded-xl text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-50">
                                    Hủy sửa
                                </button>
                            )}
                            <button type="submit" disabled={saving}
                                className="px-4 py-2 rounded-xl text-[13px] text-white bg-[#0071E3] hover:bg-[#0062C4] disabled:opacity-50">
                                {editing ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
                            </button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </AccessibleDialog>
    );
}

interface QuestionGroupProps {
    label: string;
    questions: IInterviewQuestion[];
    emptyText?: string;
    onEdit: (question: IInterviewQuestion) => void;
    action: { label: string; onClick: (question: IInterviewQuestion) => void };
}

function QuestionGroup({ label, questions, emptyText, onEdit, action }: QuestionGroupProps) {
    return (
        <section aria-label={label}>
            <h3 className="text-[13px] text-[#1D1D1F] font-semibold mb-2" aria-hidden="true">{label}</h3>
            {questions.length === 0 ? (
                <p className="text-[12px] text-[#AEAEB2]">{emptyText}</p>
            ) : (
                <ul className="space-y-2">
                    {questions.map((question) => (
                        <li key={question.questionId} className="rounded-xl border border-[#F2F2F7] p-3">
                            <p className="text-[13px] text-[#1D1D1F]">{question.questionText}</p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {question.expectedPoints.map((point, index) => (
                                    <span key={`${index}-${point}`}
                                        className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] rounded-md px-2 py-0.5">{point}</span>
                                ))}
                            </div>
                            <div className="mt-2 flex gap-2">
                                <button type="button" onClick={() => onEdit(question)}
                                    aria-label={`Sửa câu hỏi: ${question.questionText}`}
                                    className="text-[12px] text-[#0071E3] hover:underline">Sửa</button>
                                <button type="button" onClick={() => action.onClick(question)}
                                    aria-label={`${action.label}: ${question.questionText}`}
                                    className="text-[12px] text-[#6E6E73] hover:underline">
                                    {action.label === 'Ẩn câu hỏi' ? 'Ẩn' : 'Hiện lại'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

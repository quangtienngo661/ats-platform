import { IInterviewQnA } from "@/types/interfaces/interview.interface";
import { create } from "zustand";

interface InterviewChatState {
    questions: IInterviewQnA[];
    followUpQuestion: { qnaId: string, followUpQuestion: string }
    currentQuestion: { qnaId: string, orderIndex: number, questionText: string }
    setCurrentQuestion: (qnaId: string, orderIndex: number, questionText: string) => void;
    setInterviewChat: (questions: IInterviewQnA[]) => void;
    updateFollowUpQuestion: (qnaId: string, followUpQuestion: string) => void;
}

export const useInterviewChatStore = create<InterviewChatState>((set, get) => ({
    questions: [],
    followUpQuestion: {} as { qnaId: string, followUpQuestion: string },
    currentQuestion: {} as { qnaId: string, orderIndex: number, questionText: string },
    setInterviewChat: (questions: IInterviewQnA[]) => set({ questions: questions }),
    setCurrentQuestion: (qnaId: string, orderIndex: number, questionText: string) => set({ currentQuestion: { qnaId, orderIndex, questionText } }),
    updateFollowUpQuestion: (qnaId: string, followUpQuestion: string) => set({ followUpQuestion: { qnaId, followUpQuestion } }),
}))
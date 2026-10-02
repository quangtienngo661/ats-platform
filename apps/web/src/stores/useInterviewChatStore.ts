'use client';

import { IInterviewQnA } from "@/types/interfaces/interview.interface";
import { createStore } from "zustand/vanilla";
import { createRouteStore } from "./createRouteStore";

interface InterviewChatState {
    questions: IInterviewQnA[];
    followUpQuestion: { qnaId: string, followUpQuestion: string }
    currentQuestion: { qnaId: string, orderIndex: number, questionText: string }
    setCurrentQuestion: (qnaId: string, orderIndex: number, questionText: string) => void;
    setInterviewChat: (questions: IInterviewQnA[]) => void;
    updateFollowUpQuestion: (qnaId: string, followUpQuestion: string) => void;
}

export const createInterviewChatStore = (initial: IInterviewQnA) => createStore<InterviewChatState>((set) => ({
    questions: [],
    followUpQuestion: {} as { qnaId: string, followUpQuestion: string },
    currentQuestion: { qnaId: initial.qnaId, orderIndex: initial.orderIndex, questionText: initial.questionText },
    setInterviewChat: (questions: IInterviewQnA[]) => set({ questions: questions }),
    setCurrentQuestion: (qnaId: string, orderIndex: number, questionText: string) => set({ currentQuestion: { qnaId, orderIndex, questionText } }),
    updateFollowUpQuestion: (qnaId: string, followUpQuestion: string) => set({ followUpQuestion: { qnaId, followUpQuestion } }),
}))
export const { Provider: InterviewChatStoreProvider, useRouteStore: useInterviewChatStore } = createRouteStore(createInterviewChatStore, "InterviewChatStore");

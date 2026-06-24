'use client'

import { useInterviewChatStore } from "@/stores/useInterviewChatStore";
import { IInterviewQnA } from "@/types/interfaces/interview.interface";
import { useEffect, useRef } from "react";

export function InterviewChatHydrator({ initialQuestion }: { initialQuestion: IInterviewQnA }) {
    const setQuestion = useInterviewChatStore(state => state.setCurrentQuestion);
    const isHydrated = useRef(false);

    if (!isHydrated.current && initialQuestion.qnaId) {
        setQuestion(initialQuestion.qnaId, initialQuestion.orderIndex, initialQuestion.questionText);
        isHydrated.current = true;
    }

    useEffect(() => {
        setQuestion(initialQuestion.qnaId, initialQuestion.orderIndex, initialQuestion.questionText);
    }, [initialQuestion, setQuestion])


    return null
}
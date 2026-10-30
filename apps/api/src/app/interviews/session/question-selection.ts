import { DifficultyLevel, QuestionSource } from '@ats-platform/database';
import type { BankQuestion } from '../../../common/vector/vector-search.service';

export type { BankQuestion };

/** One question as the model answered it: optionally naming the bank question it was drawn from. */
export interface LlmQuestionItem {
    bankQuestionId?: string | null;
    questionText?: string;
    expectedPoints: string[];
    difficulty: DifficultyLevel;
}

/** What is saved for a session's question. `bankQuestionId` is null exactly when `source` is generated. */
export interface QnaDraft {
    questionText: string;
    expectedPoints: string[];
    difficulty: DifficultyLevel;
    source: QuestionSource;
    bankQuestionId: string | null;
}

/**
 * Checks the model's answer against what was actually retrieved (R15). The model is only trusted to
 * pick and lightly reword; whether a question is "from the bank" is decided here:
 *  - an id in the retrieved set → bank, and the bank's vetted points and difficulty are what gets saved;
 *  - an unknown id, no id, or an id already used once → generated, with no id.
 * Keeps the model's order.
 */
export function reconcileSelection(items: LlmQuestionItem[], retrieved: BankQuestion[]): QnaDraft[] {
    const byId = new Map(retrieved.map((question) => [question.questionId, question]));
    const used = new Set<string>();

    return items.map((item) => {
        const id = item.bankQuestionId;
        const bank = id ? byId.get(id) : undefined;

        if (id && bank && !used.has(id)) {
            used.add(id);
            return {
                questionText: item.questionText?.trim() || bank.questionText,
                expectedPoints: bank.expectedPoints,
                difficulty: bank.difficulty,
                source: 'bank',
                bankQuestionId: id,
            };
        }
        return {
            questionText: item.questionText ?? '',
            expectedPoints: item.expectedPoints,
            difficulty: item.difficulty,
            source: 'generated',
            bankQuestionId: null,
        };
    });
}

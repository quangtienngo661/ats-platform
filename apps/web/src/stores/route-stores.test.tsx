import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { CvStoreProvider, createCvStore, useCvStore } from './useCvStore';
import { InterviewChatStoreProvider, useInterviewChatStore } from './useInterviewChatStore';
import { createKanbanStore } from './useKanbanStore';
import type { ICvDto } from '@/types/interfaces/cv.interface';
import type { IInterviewQnA } from '@/types/interfaces/interview.interface';
import type { IApplicationDto } from '@/types/interfaces/application.interface';
import { ApplicationStatus, DifficultyLevel } from '@ats-platform/types';

const cv = (id: string): ICvDto => ({
    cvId: id, candidateId: 'sample-candidate', fileName: id, filePath: 'sample.pdf',
    uploadedAt: '2026-01-01', parsingStatus: 'completed', parsedData: null,
});
const question = (id: string): IInterviewQnA => ({
    qnaId: id, orderIndex: 1, questionText: id, difficulty: DifficultyLevel.easy,
    expectedPoints: null, answerText: null, correctnessScore: null, feedback: null,
    coveredPoints: null, missedPoints: null, hasFollowup: false,
    followupQuestion: null, followupAnswer: null, followupReason: null,
});
function Cvs() {
    const cvs = useCvStore(state => state.cvs);
    const add = useCvStore(state => state.addCv);
    return <div><output>{cvs.map(item => item.cvId).join(',')}</output><button onClick={() => add(cv('socket-update'))}>Update</button></div>;
}
function Question() {
    return <output>{useInterviewChatStore(state => state.currentQuestion.questionText)}</output>;
}

describe('route-scoped initial data', () => {
    it('renders initial CVs and the resumed question on the server, without an empty first render', () => {
        expect(renderToString(<CvStoreProvider initialState={[cv('initial')]}><Cvs /></CvStoreProvider>)).toContain('initial');
        expect(renderToString(<InterviewChatStoreProvider initialState={question('resumed')}><Question /></InterviewChatStoreProvider>)).toContain('resumed');
    });
    it('isolates simultaneous feature trees and keeps updates in their own tree', () => {
        render(<><CvStoreProvider initialState={[cv('tenant-a')]}><Cvs /></CvStoreProvider><CvStoreProvider initialState={[cv('tenant-b')]}><Cvs /></CvStoreProvider></>);
        fireEvent.click(screen.getAllByRole('button', { name: 'Update' })[0]);
        expect(screen.getAllByRole('status').map(element => element.textContent)).toEqual(['socket-update,tenant-a', 'tenant-b']);
    });
    it('starts a new route with its own data instead of retaining the previous route', () => {
        const view = render(<CvStoreProvider key="a" initialState={[cv('a')]}><Cvs /></CvStoreProvider>);
        view.rerender(<CvStoreProvider key="b" initialState={[cv('b')]}><Cvs /></CvStoreProvider>);
        expect(screen.getByRole('status')).toHaveTextContent('b');
        expect(screen.queryByText('a')).toBeNull();
    });
    it('upserts repeated socket events and moves cancelled applications without duplicates', () => {
        const cvs = createCvStore([cv('same')]);
        cvs.getState().addCv({ ...cv('same'), parsingStatus: 'processing' });
        expect(cvs.getState().cvs).toHaveLength(1);
        expect(cvs.getState().cvs[0].parsingStatus).toBe('processing');
        const application = { applicationId: 'same', status: ApplicationStatus.applied } as IApplicationDto;
        const board = createKanbanStore({ board: { applied: [application] }, cancelled: [] });
        board.getState().updateKanbanBoard({ ...application, status: ApplicationStatus.cancelled });
        board.getState().updateKanbanBoard({ ...application, status: ApplicationStatus.cancelled });
        expect(board.getState().kanbanBoard.applied).toHaveLength(0);
        expect(board.getState().initialCancelledApplications).toHaveLength(1);
    });
});

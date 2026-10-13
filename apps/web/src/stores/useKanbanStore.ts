'use client';

import { IApplicationDto } from "@/types/interfaces/application.interface";
import { ApplicationStatus } from "@ats-platform/types";
import { createStore } from "zustand/vanilla";
import { createRouteStore } from "./createRouteStore";

interface KanbanState {
    kanbanBoard: Record<string, IApplicationDto[]>,
    initialCancelledApplications: IApplicationDto[],
    setKanbanBoard: (kanbanBoard: Record<string, IApplicationDto[]>) => void,
    updateKanbanBoard: (updatedApplication: IApplicationDto) => void,
    addNewApplicationToKanban: (newApplication: IApplicationDto) => void,
    setInitialCancelledApplications: (cancelledApplications: IApplicationDto[]) => void
}

export const createKanbanStore = (initial: { board: Record<string, IApplicationDto[]>; cancelled: IApplicationDto[] }) => createStore<KanbanState>((set, get) => ({
    kanbanBoard: initial.board,
    initialCancelledApplications: initial.cancelled,

    setKanbanBoard: (kanbanBoard) => set({ kanbanBoard }),

    updateKanbanBoard: (updatedApplication) => {
        const { applicationId, status } = updatedApplication;
        const board = get().kanbanBoard;
        const nextBoard = Object.fromEntries(
            Object.entries(board).map(([columnStatus, applications]) => [
                columnStatus,
                applications.filter((app) => app.applicationId !== applicationId),
            ]),
        ) as Record<string, IApplicationDto[]>;

        const nextCancelledApplications = get().initialCancelledApplications
            .filter((app) => app.applicationId !== applicationId);

        if (status === ApplicationStatus.cancelled) {
            set({
                initialCancelledApplications: [updatedApplication, ...nextCancelledApplications],
                kanbanBoard: nextBoard,
            });
            return;
        }

        set({
            initialCancelledApplications: nextCancelledApplications,
            kanbanBoard: {
                ...nextBoard,
                [status]: [...(nextBoard[status] ?? []), updatedApplication],
            },
        })
    },

    addNewApplicationToKanban: (newApplication: IApplicationDto) => {
        const { status } = newApplication;
        const applicationsList = get().kanbanBoard[status];
        if (applicationsList?.some((application) => application.applicationId === newApplication.applicationId)) {
            get().updateKanbanBoard(newApplication);
            return;
        }

        if (applicationsList) {
            set({ kanbanBoard: { ...get().kanbanBoard, [status]: [...applicationsList, newApplication] } })
        } else {
            set({ kanbanBoard: { ...get().kanbanBoard, [status]: [newApplication] } })
        }
    },

    setInitialCancelledApplications: (cancelledApplications: IApplicationDto[]) => {
        set({ initialCancelledApplications: cancelledApplications })
    }
}))

export const { Provider: KanbanStoreProvider, useRouteStore: useKanBanStore } = createRouteStore(createKanbanStore, "KanbanStore");

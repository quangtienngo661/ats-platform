import { IApplicationDto } from "@/types/interfaces/application.interface";
import { ApplicationStatus } from "@ats-platform/types";
import { create } from "zustand";

interface KanbanState {
    kanbanBoard: Record<string, IApplicationDto[]>,
    initialCancelledApplications: IApplicationDto[],
    setKanbanBoard: (kanbanBoard: Record<string, IApplicationDto[]>) => void,
    updateKanbanBoard: (updatedApplication: IApplicationDto) => void,
    addNewApplicationToKanban: (newApplication: IApplicationDto) => void,
    setInitialCancelledApplications: (cancelledApplications: IApplicationDto[]) => void
}

export const useKanBanStore = create<KanbanState>((set, get) => ({
    kanbanBoard: {},
    initialCancelledApplications: [],

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

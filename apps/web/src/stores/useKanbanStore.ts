import { IApplicationDto } from "@/types/interfaces/application.interface";
import { create } from "zustand";

interface KanbanState {
    kanbanBoard: Record<string, IApplicationDto[]>,
    setKanbanBoard: (kanbanBoard: Record<string, IApplicationDto[]>) => void,
    updateKanbanBoard: (kanbanBoard: Record<string, IApplicationDto[]>) => void
}

export const useKanBanStore = create<KanbanState>((set, get) => ({
    kanbanBoard: {},
    setKanbanBoard: (kanbanBoard) => set({ kanbanBoard }),
    updateKanbanBoard: (kanbanBoard) => set({ kanbanBoard }),
}))
'use client'

import { useKanBanStore } from "@/stores/useKanbanStore";
import { IApplicationDto } from "@/types/interfaces/application.interface";
import { useEffect, useRef } from "react";

type KanbanHydratorProps = {
    initialBoard: Record<string, IApplicationDto[]>,
    initialCancelledApplications: IApplicationDto[]
}

export function KanbanHydrator({ initialBoard, initialCancelledApplications }: KanbanHydratorProps) {
    const isHydrated = useRef(false);
    const setKanbanBoard = useKanBanStore(s => s.setKanbanBoard);
    const setInitialCancelledApplications = useKanBanStore(s => s.setInitialCancelledApplications);

    if (!isHydrated.current) {
        setKanbanBoard(initialBoard);
        setInitialCancelledApplications(initialCancelledApplications)
        isHydrated.current = true;
    }

    useEffect(() => {
        setKanbanBoard(initialBoard)
    }, [initialBoard])

    useEffect(() => {
        setInitialCancelledApplications(initialCancelledApplications)
    }, [initialCancelledApplications])

    return null
}
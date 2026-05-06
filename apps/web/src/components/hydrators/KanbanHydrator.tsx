import { IApplicationDto } from "@/types/interfaces/application.interface";
import { IKanbanDto } from "@/types/interfaces/kanban.interface";

type KanbanHydratorProps = {
    initialBoard: Record<string, IApplicationDto[]>,
    jobId: string
}

export function KanbanHydrator({ initialBoard, jobId }: KanbanHydratorProps) {


    return null
}
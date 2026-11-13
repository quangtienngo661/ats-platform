'use client';

import { useDragLayer } from 'react-dnd';
import { Avatar } from '@/components/ui';
import { Candidate } from '@/types/interfaces/kanban.interface';
import { DRAG_TYPE } from '../../types/constants/kanban.constants';

/**
 * The card under the pointer while it is dragged. The HTML5 backend's native ghost is a flat snapshot, so each card
 * hides it (`getEmptyImage`) and this layer draws a lifted copy instead: shadow always, scale and tilt only when the
 * OS allows motion. Rendered once, inside the board's DndProvider.
 */
export default function KanbanDragLayer({ candidates }: { candidates: Candidate[] }) {
  const { isDragging, itemType, item, currentOffset } = useDragLayer(monitor => ({
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType(),
    item: monitor.getItem() as { id: string } | null,
    currentOffset: monitor.getSourceClientOffset(),
  }));

  if (!isDragging || itemType !== DRAG_TYPE || !item || !currentOffset) return null;
  const candidate = candidates.find(c => c.id === item.id);
  if (!candidate) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-popover"
      style={{ transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)` }}
    >
      {/* 17.25rem: a card's width in its 18rem column (w-72) minus the drop zone's p-1.5 on each side. */}
      <div className="w-[17.25rem] rounded-card bg-surface p-3 shadow-e4 motion-safe:rotate-1 motion-safe:scale-[1.02]">
        <div className="flex items-center gap-2.5">
          <Avatar name={candidate.name} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-medium text-ink">{candidate.name}</p>
            <p className="truncate text-caption text-ink-3">{candidate.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

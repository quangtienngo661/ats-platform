import { render, screen } from '@testing-library/react';
import { useDragLayer } from 'react-dnd';
import { describe, expect, it, vi } from 'vitest';
import type { Candidate } from '@/types/interfaces/kanban.interface';
import KanbanDragLayer from './KanbanDragLayer';

// jsdom cannot run a native drag, so the monitor state the layer reads is given directly.
vi.mock('react-dnd', async (importOriginal) => ({ ...(await importOriginal<object>()), useDragLayer: vi.fn() }));

const card = (id: string, name: string, role: string): Candidate => ({
  id,
  name,
  role,
  initials: '',
  avatarColor: '',
  rating: 0,
  daysInStage: 0,
  source: 'Website',
  stage: 'applied',
  score: 0,
  location: '',
  tags: [],
});

const candidates = [card('app-1', 'Nguyễn Văn An', 'Backend Developer'), card('app-2', 'Trần Thị Bình', 'Data Engineer')];

function dragState(state: Partial<{ isDragging: boolean; itemType: string; item: { id: string } | null; currentOffset: { x: number; y: number } | null }>) {
  vi.mocked(useDragLayer).mockReturnValue({
    isDragging: true,
    itemType: 'CARD',
    item: { id: 'app-2' },
    currentOffset: { x: 120, y: 48 },
    ...state,
  });
}

describe('KanbanDragLayer', () => {
  it('draws the dragged candidate, found by the drag item id, at the source offset', () => {
    dragState({});
    render(<KanbanDragLayer candidates={candidates} />);

    const name = screen.getByText('Trần Thị Bình');
    expect(screen.getByText('Data Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn An')).toBeNull();
    const layer = name.closest('[aria-hidden="true"]') as HTMLElement;
    expect(layer.style.transform).toBe('translate(120px, 48px)');
  });

  it('draws nothing when no card is dragged, the position is unknown, or the item is not on the board', () => {
    for (const state of [{ isDragging: false }, { currentOffset: null }, { item: { id: 'gone' } }, { itemType: 'FILE' }]) {
      dragState(state);
      const { container, unmount } = render(<KanbanDragLayer candidates={candidates} />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});

import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, expect, it, vi } from 'vitest';
import type { Candidate } from '@/types/interfaces/kanban.interface';
import KanbanCard from './KanbanCard';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

const candidate: Candidate = {
  id: 'app-1',
  name: 'Nguyễn Văn An',
  role: 'Backend Developer',
  initials: 'VA',
  avatarColor: '#0071E3',
  rating: 4,
  daysInStage: 2,
  source: 'Website',
  stage: 'screening',
  score: 77,
  location: '',
  tags: [],
  screeningStatus: 'completed',
};

function renderCard(overrides: Partial<Candidate>) {
  return render(
    <DndProvider backend={HTML5Backend}>
      <KanbanCard
        candidate={{ ...candidate, ...overrides }}
        jobId="job-1"
        onMenu={vi.fn()}
        onDrop={vi.fn()}
      />
    </DndProvider>,
  );
}

describe('KanbanCard — reviewed score', () => {
  it('shows the score and the text "Đã duyệt" once a reviewer has confirmed the screening', () => {
    renderCard({ reviewed: true });

    expect(screen.getByText('77')).toBeVisible();
    expect(screen.getByText('Đã duyệt')).toBeVisible();
  });

  it('shows the AI score without "Đã duyệt" when nobody reviewed it', () => {
    renderCard({ reviewed: false });

    expect(screen.getByText('77')).toBeVisible();
    // Control: the card does render its other screening label, so a missing "Đã duyệt" is real.
    expect(screen.getByText('Đã AI Sàng lọc')).toBeVisible();
    expect(screen.queryByText('Đã duyệt')).not.toBeInTheDocument();
  });
});

describe('KanbanCard — AI co-pilot suggestion (GĐ4 C12)', () => {
  const suggestion = {
    ruleId: 'invite_interview',
    key: 'invite_interview:screening:2026-11-18T03:00:00.000Z',
    title: 'Mời phỏng vấn',
    reasons: ['Điểm sàng lọc 77 (AI), ngưỡng 60.'],
    action: { type: 'move_status' as const, to: 'interview' as const },
  };

  it('offers the suggestion as a button that opens it', async () => {
    const onSuggestion = vi.fn();
    render(
      <DndProvider backend={HTML5Backend}>
        <KanbanCard candidate={candidate} jobId="job-1" onMenu={vi.fn()} onDrop={vi.fn()}
          suggestion={suggestion} onSuggestion={onSuggestion} />
      </DndProvider>,
    );

    screen.getByRole('button', { name: 'Gợi ý: Mời phỏng vấn' }).click();

    expect(onSuggestion).toHaveBeenCalledWith('app-1');
  });

  it('shows no suggestion line when there is none', () => {
    renderCard({});

    expect(screen.queryByRole('button', { name: /^Gợi ý:/ })).toBeNull();
  });
});

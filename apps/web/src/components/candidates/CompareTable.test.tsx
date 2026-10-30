import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { IComparisonItem } from '@/types/interfaces/evaluation.interface';

const items: IComparisonItem[] = [
  {
    applicationId: 'app-1',
    candidateName: 'Nguyễn Văn A',
    status: 'interview',
    appliedAt: '2026-10-01T02:00:00.000Z',
    screening: {
      overallScore: 85,
      skillsScore: 82,
      experienceScore: 78,
      educationScore: 91,
      aiRecommendation: 'interview',
      matchedSkills: ['TypeScript'],
      missingSkills: ['Kubernetes'],
      isReviewed: false,
    },
    scorecards: {
      count: 2,
      average: { technicalSkills: 4.5, problemSolving: 3.5, communication: 4.25, cultureFit: 2.5 },
      recommendations: [{ interviewerName: 'Trần Thị B', recommendation: 'yes' }],
    },
    noteCount: 7,
  },
  {
    applicationId: 'app-2',
    candidateName: 'Lê Thị C',
    status: 'offer',
    appliedAt: '2026-10-02T02:00:00.000Z',
    screening: {
      overallScore: 72,
      skillsScore: 69,
      experienceScore: 66,
      educationScore: 88,
      aiRecommendation: 'reject',
      matchedSkills: ['SQL'],
      missingSkills: ['TypeScript'],
      isReviewed: false,
    },
    scorecards: {
      count: 1,
      average: { technicalSkills: 3.25, problemSolving: 2.75, communication: 4.75, cultureFit: 3.75 },
      recommendations: [{ interviewerName: 'Phạm Văn D', recommendation: 'strong_yes' }],
    },
    noteCount: 9,
  },
  {
    applicationId: 'app-3',
    candidateName: 'Võ Văn E',
    status: 'cancelled',
    appliedAt: '2026-10-03T02:00:00.000Z',
    screening: null,
    scorecards: {
      count: 0,
      average: { technicalSkills: null, problemSolving: null, communication: null, cultureFit: null },
      recommendations: [],
    },
    noteCount: 0,
  },
];

describe('CompareTable', () => {
  it('CompareTable shows AI scores labelled as suggestions, scorecard averages and no ranking', async () => {
    const modulePath = './CompareTable';
    const { CompareTable } = await import(/* @vite-ignore */ modulePath);
    render(<CompareTable items={items} jobId="job-1" />);
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(4);
    items.forEach((item, index) => expect(headers[index + 1]).toHaveTextContent(item.candidateName));
    expect(within(table).getAllByText(/gợi ý/i).length).toBeGreaterThan(0);
    expect(table).toHaveTextContent(/AI.*gợi ý|gợi ý.*AI/i);

    function columnContains(index: number, pattern: RegExp) {
      const cells = within(table).getAllByRole('row').map(row => row.querySelectorAll('th, td')[index + 1]);
      const matching = cells.find(cell => cell && pattern.test(cell.textContent ?? ''));
      expect(matching).toBeDefined();
      expect(matching).toBeVisible();
    }

    for (const [index, item] of items.slice(0, 2).entries()) {
      const screening = item.screening;
      if (!screening) throw new Error('fixture must have screening');
      for (const score of [screening.overallScore, screening.skillsScore, screening.experienceScore, screening.educationScore]) {
        columnContains(index, new RegExp(`(^|\\s)${score}(?=\\s|/|$)`));
      }
      for (const average of Object.values(item.scorecards.average)) {
        columnContains(index, new RegExp(`(^|\\s)${String(average).replace('.', '[.,]')}(?=\\s|/|$)`));
      }
      columnContains(index, new RegExp(`(^|\\s)${item.noteCount}(?=\\s|$)`));
      columnContains(index, new RegExp(item.scorecards.recommendations[0].interviewerName));
    }
    columnContains(0, /Nên tuyển/i);
    columnContains(1, /Rất nên tuyển/i);
    columnContains(0, /Phỏng vấn/i);
    columnContains(1, /Offer|Đề nghị/i);
    columnContains(2, /Đã hủy|Đã huỷ/i);
    const missing = within(table).getAllByText(/chưa có/i);
    expect(missing.length).toBeGreaterThanOrEqual(2);
    for (const cell of missing) expect(cell).toBeVisible();
    // Both the absent AI screening and absent scorecard averages belong to this column.
    const emptyColumn = within(table).getAllByRole('row')
      .map(row => row.querySelectorAll('th, td')[3]?.textContent ?? '');
    expect(emptyColumn.filter(text => /chưa có/i.test(text)).length).toBeGreaterThanOrEqual(2);
    expect(table).not.toHaveTextContent(/tốt nhất|xếp hạng|\brank(?:ing)?\b|hạng\s*#?\d/i);
  });

  describe('effective scores (3b)', () => {
    const reviewedItems: IComparisonItem[] = [
      { ...items[0], screening: { ...(items[0].screening as NonNullable<IComparisonItem["screening"]>), overallScore: 77, skillsScore: 90, isReviewed: true } },
      items[1],
      items[2],
    ];

    async function renderTable(list: IComparisonItem[]) {
      const modulePath = './CompareTable';
      const { CompareTable } = await import(/* @vite-ignore */ modulePath);
      render(<CompareTable items={list} jobId="job-1" />);
      return screen.getByRole('table');
    }

    const cellsOf = (table: HTMLElement, label: string) => {
      const row = within(table).getAllByRole('row').find(r => r.querySelector('th')?.textContent === label);
      expect(row, label).toBeDefined();
      return Array.from(row?.querySelectorAll('td') ?? []).map(td => td.textContent);
    };

    it('shows the reviewed score with "Đã duyệt" for a reviewed candidate and the AI score without it for the rest', async () => {
      const table = await renderTable(reviewedItems);

      expect(cellsOf(table, 'Điểm tổng thể')).toEqual(['77 / 100', '72 / 100', 'Chưa có']);
      expect(cellsOf(table, 'Điểm kỹ năng')).toEqual(['90 / 100', '69 / 100', 'Chưa có']);
      expect(cellsOf(table, 'Duyệt điểm')).toEqual(['Đã duyệt', 'Chưa duyệt', 'Chưa có']);
    });

    it('keeps the AI recommendation labelled as an AI suggestion', async () => {
      const table = await renderTable(reviewedItems);

      expect(within(table).getByText('Khuyến nghị AI (gợi ý)')).toBeVisible();
    });
  });
});

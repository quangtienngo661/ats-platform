import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiUsageLogsFilter } from './AiUsageLogsFilter';

describe('AiUsageLogsFilter — embedding calls (P0-C10)', () => {
  it('filter offers the "Embedding" option and reports it when chosen', async () => {
    const onActionFilterChange = vi.fn();
    render(
      <AiUsageLogsFilter
        actionFilter="all"
        statusFilter="all"
        onActionFilterChange={onActionFilterChange}
        onStatusFilterChange={vi.fn()}
        totalCount={10}
        filteredCount={10}
      />,
    );

    const select = screen.getByRole('combobox', { name: 'Lọc loại thao tác AI' });
    expect(screen.getByRole('option', { name: 'Embedding' })).toBeInTheDocument();
    // Control: an option that already existed is found by the same query.
    expect(screen.getByRole('option', { name: 'Job Parsing' })).toBeInTheDocument();

    await userEvent.selectOptions(select, 'Embedding');

    expect(onActionFilterChange).toHaveBeenCalledWith('embedding');
  });
});

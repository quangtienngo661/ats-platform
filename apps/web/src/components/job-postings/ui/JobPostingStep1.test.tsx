import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JobPostingStep1 } from './JobPostingStep1';

vi.mock('@/components/common/RichTextEditor', () => ({ RichTextEditor: () => null }));

describe('JobPostingStep1 — shared work-type labels', () => {
  it('shows the canonical labels while submitting the existing work-type values', async () => {
    const updateField = vi.fn();
    render(
      <JobPostingStep1
        formData={{ title: '', departmentId: '', locationType: 'onsite', description: '' }}
        updateField={updateField}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Hình thức' });
    for (const [label, value] of [['Văn phòng', 'onsite'], ['Remote', 'remote'], ['Hybrid', 'hybrid']]) {
      expect(within(select).getByRole('option', { name: label })).toHaveValue(value);
    }
    await userEvent.setup().selectOptions(select, 'remote');
    expect(updateField).toHaveBeenCalledWith('locationType', 'remote');
  });
});

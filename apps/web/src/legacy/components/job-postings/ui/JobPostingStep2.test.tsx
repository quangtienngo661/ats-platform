import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JobPostingStep2 } from './JobPostingStep2';

function renderSalaryFields(salary = '') {
  return render(
    <form>
      <JobPostingStep2
        formData={{ categoryId: '', status: 'draft', salaryMin: salary, salaryMax: salary }}
        updateField={vi.fn()}
        parsedJobPosting={null}
        isParsing={false}
        skills={[]}
        skillsDb={[]}
        categories={[]}
        removeSkill={vi.fn()}
        selectedSkillToAdd=""
        setSelectedSkillToAdd={vi.fn()}
        handleAddExistingSkill={vi.fn()}
      />
    </form>,
  );
}

describe('JobPostingStep2 — salary in VNĐ', () => {
  it('labels both salary fields in VNĐ and explains how to enter the full amount', () => {
    renderSalaryFields();

    const minimum = screen.getByRole('spinbutton', { name: 'Mức lương từ (VNĐ)' });
    const maximum = screen.getByRole('spinbutton', { name: 'Mức lương đến (VNĐ)' });
    expect(minimum).toHaveAttribute('placeholder', '15000000');
    expect(maximum).toHaveAttribute('placeholder', '25000000');
    for (const input of [minimum, maximum]) {
      expect(input).toHaveAttribute('min', '0');
    }
    expect(screen.getByText('Nhập số tiền đầy đủ theo VNĐ, ví dụ 15000000 cho 15 triệu.')).toBeInTheDocument();
  });

  it('allows whole-VNĐ amounts without a step restriction larger than one', () => {
    renderSalaryFields();
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(2);
    for (const input of inputs) {
      expect([null, '1']).toContain(input.getAttribute('step'));
    }
  });

  it('accepts 15200000 VNĐ in both salary fields through native form validation', () => {
    renderSalaryFields('15200000');
    const inputs = screen.getAllByRole<HTMLInputElement>('spinbutton');
    expect(inputs).toHaveLength(2);
    for (const input of inputs) {
      expect(input).toHaveValue(15200000);
      expect(input.checkValidity()).toBe(true);
      expect(input.validity.stepMismatch).toBe(false);
    }
  });
});

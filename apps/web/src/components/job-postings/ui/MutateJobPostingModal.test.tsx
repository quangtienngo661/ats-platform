import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IRecruiterDto } from '@/types/interfaces/recruiter.interface';
import { MutateJobPostingModal } from './MutateJobPostingModal';

vi.mock('@/components/common/RichTextEditor', () => ({
  RichTextEditor: ({ ariaLabel, onChange }: { ariaLabel: string; onChange: (v: string) => void }) => (
    <textarea aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/servers/job-postings/job-postings.action', () => ({
  createJobPostingAction: vi.fn(async () => ({ success: false, message: '' })),
  updateJobPostingAction: vi.fn(async () => ({ success: false, message: '' })),
  parseJdPreviewAction: vi.fn(async () => ({
    success: true,
    message: 'Đã phân tích',
    data: { job_summary: null, responsibilities: [], requirements: { hard_skills: [] }, nice_to_haves: [] },
  })),
}));

const recruiter = {
  recruiterId: 'r1',
  userId: 'u1',
  department: { departmentId: 'd1', name: 'Kỹ thuật' },
} as unknown as IRecruiterDto;

function renderModal() {
  return render(
    <MutateJobPostingModal
      onClose={vi.fn()}
      editingJob={null}
      skillsDb={[]}
      categories={[]}
      currentRecruiter={recruiter}
      userRole="recruiter"
    />,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('MutateJobPostingModal', () => {
  it('shows two labelled steps with step 1 current', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Tạo tin tuyển dụng' })).toBeInTheDocument();
    const steps = screen.getAllByRole('listitem').filter((li) => li.hasAttribute('aria-current') || li.dataset.step);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toHaveAttribute('aria-current', 'step');
    expect(steps[0]).toHaveTextContent('Thông tin chung');
    expect(steps[1]).not.toHaveAttribute('aria-current');
    expect(steps[1]).toHaveTextContent('Mô tả và yêu cầu');
  });

  it('asks for the title inline and stays on step 1 when it is missing', async () => {
    renderModal();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(screen.getByText('Nhập tiêu đề vị trí.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Tiêu đề vị trí/ })).toBeInvalid();
    expect(screen.getAllByRole('listitem').find((li) => li.dataset.step === '1')).toHaveAttribute('aria-current', 'step');
  });

  it('moves to step 2 when step 1 is valid', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByRole('textbox', { name: /Tiêu đề vị trí/ }), 'Frontend Developer');
    await user.type(screen.getByRole('textbox', { name: 'Mô tả công việc' }), 'Xây dựng giao diện');
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    const step2 = await screen.findByText('Mô tả và yêu cầu', { selector: '[data-step="2"] *' });
    expect(step2.closest('[data-step="2"]')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Lưu tin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
  });
});

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IScorecardInput } from '@/types/interfaces/evaluation.interface';
import { ScorecardForm } from './ScorecardForm';

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock('@/servers/scorecards/scorecards.action', () => ({ submitScorecardAction: mocks.submit }));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ratings = [
  { label: 'Kỹ năng chuyên môn', value: 4 },
  { label: 'Giải quyết vấn đề', value: 3 },
  { label: 'Giao tiếp', value: 5 },
  { label: 'Phù hợp văn hoá', value: 2 },
] as const;
const commentText = 'Trình bày rõ ràng, cần bổ sung kinh nghiệm thiết kế hệ thống.';
const input: IScorecardInput = {
  technicalSkills: 4,
  problemSolving: 3,
  communication: 5,
  cultureFit: 2,
  recommendation: 'yes',
  comment: commentText,
};

async function chooseRecommendation(user: ReturnType<typeof userEvent.setup>) {
  const select = screen.queryByRole('combobox', { name: /Khuyến nghị/i });
  if (select) await user.selectOptions(select, 'yes');
  else await user.click(screen.getByRole('radio', { name: 'Nên tuyển' }));
}

async function expectBlocked(user: ReturnType<typeof userEvent.setup>) {
  const submit = screen.getByRole('button', { name: /^(Nộp|Lưu) đánh giá$/ });
  if ((submit as HTMLButtonElement).disabled) {
    expect(submit).toBeDisabled();
  } else {
    await user.click(submit);
    expect(await screen.findByRole('alert')).toHaveTextContent(/\S/);
  }
  expect(mocks.submit).not.toHaveBeenCalled();
}

beforeEach(() => {
  mocks.submit.mockReset();
  mocks.submit.mockResolvedValue({ success: true, message: 'Đã lưu đánh giá' });
});

describe('ScorecardForm', () => {
  // Omit each required choice in turn, including the recommendation — one test per case.
  it.each([
    { missing: 0, what: 'Kỹ năng chuyên môn' },
    { missing: 1, what: 'Giải quyết vấn đề' },
    { missing: 2, what: 'Giao tiếp' },
    { missing: 3, what: 'Phù hợp văn hoá' },
    { missing: 4, what: 'khuyến nghị' },
  ])('ScorecardForm blocks submit until all four ratings and a recommendation are chosen (thiếu $what)', async ({ missing }) => {
    const user = userEvent.setup();
    mocks.submit.mockClear();
    const onSaved = vi.fn();
    const form = render(<ScorecardForm interviewId="int-1" disabled={false} onSaved={onSaved} />);
    await expectBlocked(user);
    for (const [index, rating] of ratings.entries()) {
      const group = within(screen.getByRole('radiogroup', { name: rating.label }));
      expect(group.getAllByRole('radio')).toHaveLength(5);
      for (const value of [1, 2, 3, 4, 5]) {
        expect(group.getByRole('radio', { name: String(value) })).not.toBeChecked();
      }
      if (index !== missing) await user.click(group.getByRole('radio', { name: String(rating.value) }));
    }
    if (missing !== 4) await chooseRecommendation(user);
    const comment = screen.getByRole('textbox', { name: /Nhận xét/i });
    expect(comment).toHaveAttribute('maxlength', '2000');
    await user.type(comment, commentText);
    await expectBlocked(user);
    expect(onSaved).not.toHaveBeenCalled();

    if (missing === 4) await chooseRecommendation(user);
    else {
      const rating = ratings[missing];
      await user.click(within(screen.getByRole('radiogroup', { name: rating.label }))
        .getByRole('radio', { name: String(rating.value) }));
    }
    await user.click(screen.getByRole('button', { name: /^(Nộp|Lưu) đánh giá$/ }));
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledExactlyOnceWith('int-1', input));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    form.unmount();
  });

  it('ScorecardForm shows the API message when the submit is refused and keeps the typed values', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const message = 'Đơn đã chốt, không thể sửa đánh giá';
    mocks.submit.mockResolvedValue({ success: false, message });
    render(<ScorecardForm interviewId="int-1" disabled={false} onSaved={onSaved} />);

    for (const rating of ratings) {
      await user.click(within(screen.getByRole('radiogroup', { name: rating.label }))
        .getByRole('radio', { name: String(rating.value) }));
    }
    await chooseRecommendation(user);
    await user.type(screen.getByRole('textbox', { name: /Nhận xét/i }), commentText);
    await user.click(screen.getByRole('button', { name: /^(Nộp|Lưu) đánh giá$/ }));

    expect(await screen.findByText(message)).toBeVisible();
    expect(mocks.submit).toHaveBeenCalledExactlyOnceWith('int-1', input);
    for (const rating of ratings) {
      expect(within(screen.getByRole('radiogroup', { name: rating.label }))
        .getByRole('radio', { name: String(rating.value) })).toBeChecked();
    }
    const recommendation = screen.queryByRole('combobox', { name: /Khuyến nghị/i });
    if (recommendation) expect(recommendation).toHaveValue('yes');
    else expect(screen.getByRole('radio', { name: 'Nên tuyển' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: /Nhận xét/i })).toHaveValue(input.comment);
    expect(onSaved).not.toHaveBeenCalled();
  });
});

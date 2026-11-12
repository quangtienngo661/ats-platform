import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ICopilotSuggestion } from '@/types/interfaces/copilot.interface';
import { CopilotSuggestionDialog } from './CopilotSuggestionDialog';

const actions = vi.hoisted(() => ({
  apply: vi.fn(),
  dismiss: vi.fn(),
  explain: vi.fn(),
}));
vi.mock('@/servers/applications/copilot.action', () => ({
  applyCopilotSuggestionAction: actions.apply,
  dismissCopilotSuggestionAction: actions.dismiss,
  explainCopilotSuggestionAction: actions.explain,
}));

const invite: ICopilotSuggestion = {
  ruleId: 'invite_interview',
  key: 'invite_interview:screening:2026-11-18T03:00:00.000Z',
  title: 'Mời phỏng vấn',
  reasons: ['Điểm sàng lọc 78 (AI), ngưỡng 60.'],
  action: { type: 'move_status', to: 'interview' },
};

function renderDialog(suggestion: ICopilotSuggestion = invite) {
  const props = { onClose: vi.fn(), onApplied: vi.fn(), onDismissed: vi.fn() };
  render(
    <CopilotSuggestionDialog
      applicationId="app-1"
      candidateName="Nguyễn Văn A"
      jobId="job-1"
      suggestion={suggestion}
      {...props}
    />,
  );
  return props;
}

describe('CopilotSuggestionDialog (C12)', () => {
  it('shows the suggestion, its reasons and that the recruiter decides', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Gợi ý của AI co-pilot' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mời phỏng vấn' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Lý do' })).toHaveTextContent('Điểm sàng lọc 78 (AI), ngưỡng 60.');
    expect(screen.getByText('Bạn quyết định; gợi ý không tự thực hiện.')).toBeInTheDocument();
  });

  it('applies a status move with the suggestion key and hands back the refreshed application', async () => {
    const user = userEvent.setup();
    const application = { applicationId: 'app-1', status: 'interview' };
    actions.apply.mockResolvedValue({ ok: true, data: { application } });
    const props = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));

    expect(actions.apply).toHaveBeenCalledWith('app-1', invite.key);
    await waitFor(() => expect(props.onApplied).toHaveBeenCalledWith(application));
  });

  it('shows why an apply was refused and stays open', async () => {
    const user = userEvent.setup();
    actions.apply.mockResolvedValue({ ok: false, message: 'Gợi ý đã thay đổi. Tải lại trang để xem gợi ý mới.' });
    const props = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Áp dụng' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Gợi ý đã thay đổi. Tải lại trang để xem gợi ý mới.');
    expect(props.onApplied).not.toHaveBeenCalled();
  });

  it('runs the AI screening for that kind of suggestion', () => {
    renderDialog({ ...invite, ruleId: 'screening_missing', title: 'Chạy sàng lọc AI', action: { type: 'run_screening' } });

    expect(screen.getByRole('button', { name: 'Chạy sàng lọc' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Áp dụng' })).toBeNull();
  });

  it.each([
    [{ type: 'open_profile' as const }, 'Mở hồ sơ', '/jobs/job-1/candidates/app-1'],
    [{ type: 'schedule_interview' as const }, 'Đặt lịch', '/interviews'],
  ])('a %o suggestion only links; it has no apply button', (action, label, href) => {
    renderDialog({ ...invite, ruleId: 'below_threshold', action });

    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
    expect(screen.queryByRole('button', { name: 'Áp dụng' })).toBeNull();
  });

  it('dismisses with the key', async () => {
    const user = userEvent.setup();
    actions.dismiss.mockResolvedValue({ ok: true, data: null });
    const props = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Bỏ qua' }));

    expect(actions.dismiss).toHaveBeenCalledWith('app-1', invite.key);
    await waitFor(() => expect(props.onDismissed).toHaveBeenCalled());
  });

  it('shows the AI explanation, or the reason it could not be made', async () => {
    const user = userEvent.setup();
    actions.explain.mockResolvedValueOnce({ ok: false, message: 'Chưa tạo được giải thích, hãy dùng các lý do bên dưới.' });
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'AI giải thích' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tạo được giải thích, hãy dùng các lý do bên dưới.');

    actions.explain.mockResolvedValueOnce({ ok: true, data: { explanation: 'Điểm 78 cao hơn ngưỡng 60.' } });
    await user.click(screen.getByRole('button', { name: 'AI giải thích' }));
    expect(await screen.findByLabelText('Giải thích của AI')).toHaveTextContent('Điểm 78 cao hơn ngưỡng 60.');
  });
});

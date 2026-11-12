import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICVScreening } from '@ats-platform/types';
import { ReviewScreeningButton } from './ReviewScreeningButton';

const mocks = vi.hoisted(() => ({
  review: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock('@/servers/cv-screenings/cv-screenings.action', () => ({
  reviewScreeningAction: mocks.review,
}));
vi.mock('@/lib/toast', () => ({ toast: { success: mocks.success, error: mocks.error } }));

const screening = {
  screeningId: 'screen-1',
  applicationId: 'app-1',
  status: 'completed',
  overallScore: 73,
  skillsScore: 80,
  experienceScore: 70,
  educationScore: 60,
} as unknown as ICVScreening;

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Duyệt điểm' }));
  return screen.getByRole('dialog', { name: 'Duyệt điểm sàng lọc' });
}

describe('ReviewScreeningButton', () => {
  beforeEach(() => {
    mocks.review.mockReset().mockResolvedValue({ success: true, message: 'ok' });
    mocks.success.mockReset();
    mocks.error.mockReset();
  });

  it('opens from the "Duyệt điểm" button and shows AI scores side by side with the editable scores', async () => {
    render(<ReviewScreeningButton applicationId="app-1" screening={screening} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const dialog = await openDialog();

    const rows = within(dialog).getAllByRole('row').slice(1);
    expect(rows.map(row => within(row).getAllByRole('cell').map(cell => cell.textContent)[0])).toEqual([
      'Kỹ năng',
      'Kinh nghiệm',
      'Học vấn',
    ]);
    expect(rows.map(row => within(row).getAllByRole('cell')[1].textContent)).toEqual(['80', '70', '60']);
    expect(within(dialog).getByRole('spinbutton', { name: 'Điểm kỹ năng sau duyệt' })).toHaveValue(80);
    expect(within(dialog).getByRole('spinbutton', { name: 'Điểm kinh nghiệm sau duyệt' })).toHaveValue(70);
    expect(within(dialog).getByRole('spinbutton', { name: 'Điểm học vấn sau duyệt' })).toHaveValue(60);
  });

  it('prefills the last reviewed scores when the screening was already reviewed, while still showing the AI scores', async () => {
    render(
      <ReviewScreeningButton
        applicationId="app-1"
        screening={{
          ...screening,
          reviewedAt: '2026-10-30T08:00:00.000Z',
          reviewedSkillsScore: 90,
          reviewedExperienceScore: 65,
          reviewedEducationScore: 55,
        }}
      />,
    );

    const dialog = await openDialog();

    expect(within(dialog).getByRole('spinbutton', { name: 'Điểm kỹ năng sau duyệt' })).toHaveValue(90);
    const aiCells = within(dialog).getAllByRole('row').slice(1).map(row => within(row).getAllByRole('cell')[1].textContent);
    expect(aiCells).toEqual(['80', '70', '60']);
  });

  it('submitting changed scores without a note shows "Vui lòng nhập lý do khi sửa điểm" and sends nothing', async () => {
    render(<ReviewScreeningButton applicationId="app-1" screening={screening} />);
    const dialog = await openDialog();

    const skills = within(dialog).getByRole('spinbutton', { name: 'Điểm kỹ năng sau duyệt' });
    await userEvent.clear(skills);
    await userEvent.type(skills, '90');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu điểm duyệt' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Vui lòng nhập lý do khi sửa điểm');
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it('confirming unchanged scores calls the action without a note', async () => {
    render(<ReviewScreeningButton applicationId="app-1" screening={screening} />);
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận điểm' }));

    await waitFor(() => expect(mocks.review).toHaveBeenCalledTimes(1));
    expect(mocks.review).toHaveBeenCalledWith('app-1', {
      skillsScore: 80,
      experienceScore: 70,
      educationScore: 60,
    });
    expect(mocks.success).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('a changed score with a note is sent with the note, then the dialog closes', async () => {
    render(<ReviewScreeningButton applicationId="app-1" screening={screening} />);
    const dialog = await openDialog();

    const education = within(dialog).getByRole('spinbutton', { name: 'Điểm học vấn sau duyệt' });
    await userEvent.clear(education);
    await userEvent.type(education, '75.5');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Lý do/ }), 'Có thêm chứng chỉ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu điểm duyệt' }));

    await waitFor(() => expect(mocks.review).toHaveBeenCalledTimes(1));
    expect(mocks.review).toHaveBeenCalledWith('app-1', {
      skillsScore: 80,
      experienceScore: 70,
      educationScore: 75.5,
      note: 'Có thêm chứng chỉ',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('a score outside 0–100 is rejected before anything is sent', async () => {
    render(<ReviewScreeningButton applicationId="app-1" screening={screening} />);
    const dialog = await openDialog();

    const skills = within(dialog).getByRole('spinbutton', { name: 'Điểm kỹ năng sau duyệt' });
    await userEvent.clear(skills);
    await userEvent.type(skills, '101');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Lý do/ }), 'Lý do');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu điểm duyệt' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Điểm phải từ 0 đến 100');
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it('a server refusal is shown in the dialog, which stays open', async () => {
    mocks.review.mockResolvedValue({ success: false, message: 'Chỉ duyệt được kết quả sàng lọc đã hoàn tất' });
    render(<ReviewScreeningButton applicationId="app-1" screening={screening} />);
    const dialog = await openDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận điểm' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Chỉ duyệt được kết quả sàng lọc đã hoàn tất');
    expect(screen.getByRole('dialog', { name: 'Duyệt điểm sàng lọc' })).toBeVisible();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('offers no review button until the screening is completed', () => {
    render(
      <ReviewScreeningButton
        applicationId="app-1"
        screening={{ ...screening, status: 'processing' } as unknown as ICVScreening}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Duyệt điểm' })).not.toBeInTheDocument();
  });
});

// Component behaviour only: jsdom does not prove layout or colour.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { ConfigCard } from './ConfigCard';

const base = {
  configId: 'config-a', organizationId: 'org-a', name: 'Engineer', description: '',
  isDefault: false, skillsWeight: 40, experienceWeight: 35, educationWeight: 25,
  minimumScoreThreshold: 60, collapsed: false,
} satisfies ConfigProfile;

function renderCard(profile: ConfigProfile, onUpdate = vi.fn()) {
  render(<ConfigCard profile={profile} onUpdate={onUpdate} onDelete={vi.fn()} onSetDefault={vi.fn()} onDuplicate={vi.fn()} />);
  return onUpdate;
}

describe('ConfigCard — weight total and default badge', () => {
  it('shows the total of a known profile as "100/100"', () => {
    renderCard(base);
    expect(screen.getByText('100/100')).toBeInTheDocument();
  });

  it('shows the "Mặc định" badge on the default profile only', () => {
    const { unmount } = render(
      <ConfigCard profile={{ ...base, isDefault: true }} onUpdate={vi.fn()} onDelete={vi.fn()} onSetDefault={vi.fn()} onDuplicate={vi.fn()} />,
    );
    expect(screen.getByText('Mặc định')).toBeInTheDocument();
    unmount();
    renderCard(base);
    expect(screen.queryByText('Mặc định')).not.toBeInTheDocument();
  });

  it('keeps the live total visible while editing and blocks saving above 100', async () => {
    const user = userEvent.setup();
    const onUpdate = renderCard(base);
    await user.click(screen.getByRole('button', { name: 'Tùy chọn' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Chỉnh sửa cấu hình' }));

    const skills = screen.getAllByRole('spinbutton', { name: 'Trọng số Kỹ năng (%)' })[0];
    await user.clear(skills);
    await user.type(skills, '41');

    expect(screen.getByText('101/100')).toBeVisible();
    expect(screen.getByText('Vượt quá 1% — tổng phải bằng 100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lưu cấu hình' })).toBeDisabled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('offers set-default and delete on a non-default profile, but not on the default one', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ConfigCard profile={base} onUpdate={vi.fn()} onDelete={vi.fn()} onSetDefault={vi.fn()} onDuplicate={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Tùy chọn' }));
    let menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Đặt làm mặc định' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Xóa cấu hình' })).toBeInTheDocument();
    unmount();

    render(
      <ConfigCard profile={{ ...base, isDefault: true }} onUpdate={vi.fn()} onDelete={vi.fn()} onSetDefault={vi.fn()} onDuplicate={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Tùy chọn' }));
    menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Nhân bản' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Đặt làm mặc định' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Xóa cấu hình' })).not.toBeInTheDocument();
  });
});

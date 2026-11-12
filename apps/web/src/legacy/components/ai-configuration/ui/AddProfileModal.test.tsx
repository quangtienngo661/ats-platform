// Component behaviour only: jsdom does not prove CSS, browser navigation or persistence.
// Keep onClose observable without unmounting: AnimatePresence also retains the exiting form.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddProfileModal } from './AddProfileModal';

const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@/servers/ai-config/ai-config.action', () => ({
  createAIConfigFormAction: mocks.create,
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const organizations = [
  { organizationId: 'org-1', name: 'Tổ chức A', slug: 'org-a' },
  { organizationId: 'org-2', name: 'Tổ chức B', slug: 'org-b' },
];

describe('AddProfileModal', () => {
  beforeEach(() => {
    mocks.create.mockResolvedValue({
      success: true,
      message: 'Tạo thành công',
      data: { configId: 'cfg-1' },
    });
  });

  it.each(['Hủy', 'Đóng cấu hình'])(
    '%s closes a valid form without creating a configuration',
    async (buttonName) => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <AddProfileModal onClose={onClose} organizations={organizations} />,
      );
      await user.type(
        screen.getByRole('textbox', { name: 'Tên cấu hình *' }),
        'Cấu hình không lưu',
      );
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Tổ chức *' }),
        'org-2',
      );

      await user.click(screen.getByRole('button', { name: buttonName }));

      expect(onClose).toHaveBeenCalled();
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );

  it('submits the selected organization and exact default weights/threshold', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddProfileModal onClose={onClose} organizations={organizations} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Tên cấu hình *' }),
      'Engineer',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Tổ chức *' }),
      'org-2',
    );
    await user.click(screen.getByRole('button', { name: 'Thêm cấu hình' }));

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const values = Object.fromEntries(
      (mocks.create.mock.calls[0][1] as FormData).entries(),
    );
    expect(values).toEqual({
      name: 'Engineer',
      description: '',
      organizationId: 'org-2',
      skillsWeight: '40',
      experienceWeight: '40',
      educationWeight: '20',
      minimumScoreThreshold: '60',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('blocks a blank or whitespace name', async () => {
    const user = userEvent.setup();
    render(<AddProfileModal onClose={vi.fn()} />);
    const submit = screen.getByRole('button', {
      name: 'Thêm cấu hình',
    });
    expect(submit).toBeDisabled();
    await user.type(
      screen.getByRole('textbox', { name: 'Tên cấu hình *' }),
      '   ',
    );
    expect(submit).toBeDisabled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('blocks submission when the weights total is not 100', async () => {
    const user = userEvent.setup();
    render(<AddProfileModal onClose={vi.fn()} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Tên cấu hình *' }),
      'Engineer',
    );
    // The first spinbutton is visibly in the first criterion, Kỹ năng.
    const skillWeight = screen.getAllByRole('spinbutton')[0];
    await user.clear(skillWeight);
    await user.type(skillWeight, '41');
    expect(screen.getByText('101/100')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Thêm cấu hình' }),
    ).toBeDisabled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('requires an explicit organization when a platform admin has multiple choices', async () => {
    const user = userEvent.setup();
    render(<AddProfileModal onClose={vi.fn()} organizations={organizations} />);
    await user.type(
      screen.getByRole('textbox', { name: 'Tên cấu hình *' }),
      'Engineer',
    );
    await user.click(screen.getByRole('button', { name: 'Thêm cấu hình' }));
    expect(screen.getByRole('combobox', { name: 'Tổ chức *' })).toBeInvalid();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

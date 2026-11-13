import type { ComponentProps } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { triggerCvScreeningAction } from '@/servers/applications/applications.action';
import ScreeningConfigModal from './ScreeningConfigModal';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));
vi.mock('@/servers/applications/applications.action', () => ({ triggerCvScreeningAction: vi.fn() }));

const profile = (configId: string, name: string, isDefault: boolean) =>
  ({
    configId,
    name,
    isDefault,
    description: null,
    skillsWeight: 50,
    experienceWeight: 30,
    educationWeight: 20,
    minimumScoreThreshold: 60,
  }) as unknown as ConfigProfile;

describe('ScreeningConfigModal', () => {
  it('submits the application and the chosen profile from the footer button outside the form', async () => {
    vi.mocked(triggerCvScreeningAction).mockResolvedValue({ success: false, message: 'Không gửi được yêu cầu.' });
    const user = userEvent.setup();
    render(
      <ScreeningConfigModal
        applicationId="app-1"
        candidateName="Nguyễn Văn An"
        roleName="Backend Developer"
        aiProfiles={[profile('cfg-default', 'Chuẩn', true), profile('cfg-senior', 'Senior', false)]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Cấu hình sàng lọc AI' })).toHaveAccessibleDescription(
      'Nguyễn Văn An • Backend Developer',
    );
    expect(screen.getByRole('radio', { name: /Chuẩn/ })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: /Senior/ }));
    await user.click(screen.getByRole('button', { name: 'Bắt đầu sàng lọc' }));

    await waitFor(() => expect(triggerCvScreeningAction).toHaveBeenCalledTimes(1));
    const form = vi.mocked(triggerCvScreeningAction).mock.calls[0][1];
    expect(form.get('applicationId')).toBe('app-1');
    expect(form.get('configId')).toBe('cfg-senior');
    expect(await screen.findByRole('alert')).toHaveTextContent('Không gửi được yêu cầu.');
  });

  it('closes from "Bỏ qua" and offers no submit button without a profile', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ScreeningConfigModal
        applicationId="app-1"
        candidateName="Nguyễn Văn An"
        roleName="Backend Developer"
        aiProfiles={[]}
        onClose={onClose}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText('Chưa có cấu hình AI')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bắt đầu sàng lọc' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Bỏ qua' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

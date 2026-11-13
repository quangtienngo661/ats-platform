// Component behaviour only: server actions are mocked.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import AIScreeningConfigClient from './AIConfigClient';

vi.mock('@/servers/ai-config/ai-config.action', () => ({
  createAIConfigFormAction: vi.fn(),
  deleteAIConfigAction: vi.fn(),
  duplicateAIConfigAction: vi.fn(),
  setDefaultAIConfigAction: vi.fn(),
  updateAIConfigAction: vi.fn(),
}));

const profile = (over: Partial<ConfigProfile>): ConfigProfile => ({
  configId: 'c1', organizationId: 'o1', name: 'Engineer', description: '', isDefault: false,
  skillsWeight: 40, experienceWeight: 40, educationWeight: 20, minimumScoreThreshold: 60, collapsed: true, ...over,
});

describe('AIScreeningConfigClient', () => {
  it('titles the page and offers the add button', () => {
    render(<AIScreeningConfigClient profiles={[profile({})]} organizations={[]} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Cấu hình AI Screening' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Thêm cấu hình mới' })).toBeVisible();
  });

  it('shows the empty state with a way to add the first configuration', () => {
    render(<AIScreeningConfigClient profiles={[]} organizations={[]} />);
    expect(screen.getByRole('heading', { name: 'Chưa có cấu hình' })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Thêm cấu hình mới' })).toHaveLength(2);
  });

  it('counts the configurations in the stats strip', () => {
    render(<AIScreeningConfigClient profiles={[profile({}), profile({ configId: 'c2', isDefault: true })]} organizations={[]} />);
    expect(screen.getByText('Tổng cấu hình').nextElementSibling?.textContent).toBe('2');
    expect(screen.getByText('Mặc định', { selector: 'dt' }).nextElementSibling?.textContent).toBe('1');
    expect(screen.queryByRole('heading', { name: 'Chưa có cấu hình' })).not.toBeInTheDocument();
  });

  it('opens the add form empty every time, not with the last draft', async () => {
    const user = userEvent.setup();
    render(<AIScreeningConfigClient profiles={[]} organizations={[]} />);
    const open = () => user.click(screen.getAllByRole('button', { name: 'Thêm cấu hình mới' })[0]);

    await open();
    await user.type(await screen.findByRole('textbox', { name: 'Tên cấu hình', exact: true }), 'Bản nháp');
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await open();
    expect(await screen.findByRole('textbox', { name: 'Tên cấu hình', exact: true })).toHaveValue('');
  });
});

// Component behaviour only. The form is a local mock: saving only toggles the button.
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompanySettingsClient } from './CompanySettingsClient';

afterEach(() => vi.useRealTimers());

describe('CompanySettingsClient', () => {
  it('titles the page and exposes every field by its label', () => {
    render(<CompanySettingsClient />);
    expect(screen.getByRole('heading', { level: 1, name: 'Thông tin công ty' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Tên công ty' })).toHaveValue('Acme Corporation');
    expect(screen.getByRole('textbox', { name: 'Mã số thuế' })).toHaveValue('0123456789');
    expect(screen.getByRole('combobox', { name: 'Lĩnh vực hoạt động' })).toHaveValue('Công nghệ thông tin');
    expect(screen.getByRole('textbox', { name: 'Về công ty' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Địa chỉ' })).toHaveValue('123 Nguyễn Huệ, Quận 1, TP.HCM');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('contact@acme.com');
    expect(screen.getByRole('textbox', { name: 'Website' })).toHaveValue('https://acme.com');
    expect(screen.getByRole('textbox', { name: 'LinkedIn' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Facebook' })).toBeVisible();
  });

  it('disables the save button while saving and restores it after', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CompanySettingsClient />);
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(screen.getByRole('button', { name: 'Đang lưu…' })).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(screen.getByRole('button', { name: 'Lưu thay đổi' })).toBeEnabled();
  });

  it('restores the starting values with "Hủy thay đổi"', async () => {
    const user = userEvent.setup();
    render(<CompanySettingsClient />);
    const name = screen.getByRole('textbox', { name: 'Tên công ty' });
    await user.clear(name);
    await user.type(name, 'Khác');
    await user.click(screen.getByRole('button', { name: 'Hủy thay đổi' }));
    expect(screen.getByRole('textbox', { name: 'Tên công ty' })).toHaveValue('Acme Corporation');
  });
});

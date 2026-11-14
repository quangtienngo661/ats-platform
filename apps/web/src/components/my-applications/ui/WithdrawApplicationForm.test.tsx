import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WithdrawApplicationForm } from './WithdrawApplicationForm';

vi.mock('@/servers/applications/applications.action', () => ({ withdrawApplicationFormAction: vi.fn() }));

describe('WithdrawApplicationForm', () => {
  it('tells the candidate the application becomes withdrawn and they can apply again', async () => {
    render(<WithdrawApplicationForm applicationId="app-1" onSuccess={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Rút đơn' }));

    expect(screen.getByRole('dialog', { name: 'Rút đơn ứng tuyển?' })).toHaveTextContent(
      'Đơn sẽ chuyển sang Đã rút. Bạn có thể ứng tuyển lại vào tin này sau.',
    );
    expect(screen.getByRole('button', { name: 'Giữ đơn' })).toBeInTheDocument();
  });
});

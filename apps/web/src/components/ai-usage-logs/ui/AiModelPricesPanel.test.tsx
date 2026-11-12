import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AiModelPricesPanel } from './AiModelPricesPanel';

const actions = vi.hoisted(() => ({ setPrice: vi.fn() }));
vi.mock('@/servers/analytics/analytics.action', () => ({ setModelPriceAction: actions.setPrice }));

describe('AiModelPricesPanel (C18)', () => {
  it('shows each model with its price, empty where none was set', () => {
    render(
      <AiModelPricesPanel
        prices={[
          { modelName: 'gpt-6-luna', inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6, updatedAt: '2026-11-12T00:00:00.000Z' },
          { modelName: 'text-embedding-3-small', inputUsdPerMillion: null, outputUsdPerMillion: null, updatedAt: null },
        ]}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Giá token vào của gpt-6-luna' })).toHaveValue('0.15');
    expect(screen.getByRole('textbox', { name: 'Giá token ra của gpt-6-luna' })).toHaveValue('0.6');
    expect(screen.getByRole('textbox', { name: 'Giá token vào của text-embedding-3-small' })).toHaveValue('');
  });

  it('saves one row with its model name and both prices', async () => {
    const user = userEvent.setup();
    actions.setPrice.mockResolvedValue({ success: true, message: 'Đã lưu giá cho text-embedding-3-small.' });
    render(
      <AiModelPricesPanel
        prices={[{ modelName: 'text-embedding-3-small', inputUsdPerMillion: null, outputUsdPerMillion: null, updatedAt: null }]}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: 'Giá token vào của text-embedding-3-small' }), '0.02');
    await user.type(screen.getByRole('textbox', { name: 'Giá token ra của text-embedding-3-small' }), '0');
    await user.click(screen.getByRole('button', { name: 'Lưu giá text-embedding-3-small' }));

    await waitFor(() => expect(actions.setPrice).toHaveBeenCalled());
    const form: FormData = actions.setPrice.mock.calls[0][1];
    expect(Object.fromEntries(form.entries())).toEqual({
      modelName: 'text-embedding-3-small',
      inputUsdPerMillion: '0.02',
      outputUsdPerMillion: '0',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu giá cho text-embedding-3-small.');
  });

  it('shows why a price was refused', async () => {
    const user = userEvent.setup();
    actions.setPrice.mockResolvedValue({ success: false, message: 'Giá phải là số từ 0 đến 100000, tối đa 4 chữ số thập phân.' });
    render(<AiModelPricesPanel prices={[{ modelName: 'm', inputUsdPerMillion: null, outputUsdPerMillion: null, updatedAt: null }]} />);

    await user.click(screen.getByRole('button', { name: 'Lưu giá m' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Giá phải là số từ 0 đến 100000, tối đa 4 chữ số thập phân.');
  });
});

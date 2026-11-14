import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUiVariant } from '@/lib/ui-variant';
import MyApplicationsPage from './page';

vi.mock('@/lib/ui-variant', () => ({ getUiVariant: vi.fn() }));
vi.mock('@/servers/applications/applications.action', () => ({ getMyApplicationsAction: vi.fn(async () => []) }));
vi.mock('@/legacy/app/(candidate)/my-applications/page', () => ({
  default: () => <div data-testid="legacy-page" />,
}));
vi.mock('@/components/my-applications/MyApplicationsClient', () => ({
  default: () => <div data-testid="modern-page" />,
}));

const variant = vi.mocked(getUiVariant);

beforeEach(() => variant.mockReset());

describe('MyApplicationsPage variant switch', () => {
  it('renders the frozen legacy page for the legacy variant', async () => {
    variant.mockResolvedValue('legacy');

    render(await MyApplicationsPage());

    expect(screen.getByTestId('legacy-page')).toBeInTheDocument();
    expect(screen.queryByTestId('modern-page')).not.toBeInTheDocument();
  });

  it('renders the new page for the modern variant', async () => {
    variant.mockResolvedValue('modern');

    render(await MyApplicationsPage());

    expect(screen.getByTestId('modern-page')).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-page')).not.toBeInTheDocument();
  });
});

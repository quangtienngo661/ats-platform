// Component labels only; per-organization default persistence is verified against the real API/DB.
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ConfigProfile } from '@/types/interfaces/configProfile.interface';
import { ConfigCard } from './ConfigCard';

const profile = {
  configId: 'config-b', organizationId: 'org-b', name: 'Engineer', description: '',
  isDefault: true, skillsWeight: 40, experienceWeight: 40, educationWeight: 20,
  minimumScoreThreshold: 60, collapsed: true,
} satisfies ConfigProfile;

describe('ConfigCard — organization label (A7)', () => {
  it('shows the provided organization beside its own default AI profile', async () => {
    render(<ConfigCard profile={profile} organizationName="Tổ chức B" onUpdate={vi.fn()} onDelete={vi.fn()} onSetDefault={vi.fn()} onDuplicate={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Tổ chức: Tổ chức B')).toBeVisible());
    expect(screen.getByText('Mặc định')).toBeVisible();
    expect(screen.queryByText('Tổ chức: Tổ chức A')).not.toBeInTheDocument();
  });

  it('does not invent an organization label when none is provided', () => {
    render(<ConfigCard profile={profile} onUpdate={vi.fn()} onDelete={vi.fn()} onSetDefault={vi.fn()} onDuplicate={vi.fn()} />);
    expect(screen.queryByText(/^Tổ chức:/)).not.toBeInTheDocument();
  });
});

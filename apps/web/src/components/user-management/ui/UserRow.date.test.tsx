// The created date is rendered on the server (UTC in Docker) and again in the browser (Vietnam time).
// If the formatter follows the process time zone the two disagree and React discards the server HTML.
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '@ats-platform/types';
import type { IUserResponseDto } from '@/types/interfaces/user.interface';

const originalTz = process.env.TZ;

function userCreatedAt(createdAt: string) {
  return {
    userId: 'user-1', fullName: 'Nguyễn Văn A', email: 'a@ats.test',
    role: UserRole.recruiter, status: UserStatus.active, organizationId: 'org-1',
    createdAt, recruiter: null,
  } as unknown as IUserResponseDto;
}

/** Loads UserRow fresh so its module-level date formatter is built under the given process time zone. */
async function renderRowUnder(tz: string, createdAt: string) {
  process.env.TZ = tz;
  vi.resetModules();
  const { UserRow } = await import('./UserRow');
  render(
    <table>
      <tbody>
        <UserRow user={userCreatedAt(createdAt)} onEdit={vi.fn()} onDelete={vi.fn()} />
      </tbody>
    </table>,
  );
}

describe('UserRow created date', () => {
  afterEach(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
    vi.resetModules();
  });

  it.each(['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles'])(
    'shows 18:30 UTC on 13/11 as 14/11/2026 under TZ=%s',
    async (tz) => {
      await renderRowUnder(tz, '2026-11-13T18:30:00Z');
      expect(screen.getByRole('cell', { name: '14/11/2026' })).toBeInTheDocument();
    },
  );

  it.each([
    ['2026-11-13T16:59:59Z', '13/11/2026'],
    ['2026-11-13T17:00:00Z', '14/11/2026'],
  ])('switches the day at Vietnam midnight: %s is %s', async (createdAt, expected) => {
    await renderRowUnder('UTC', createdAt);
    expect(screen.getByRole('cell', { name: expected })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { afterAll, describe, expect, it } from 'vitest';
import { JoinRoomButton } from './JoinRoomButton';

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';
afterAll(() => {
  process.env.TZ = originalTz;
});

const props = {
  interviewId: 'int-1',
  startAt: '2026-11-20T02:00:00.000Z', // 09:00 in Vietnam
  durationMinutes: 60,
  status: 'scheduled' as const,
};

describe('JoinRoomButton', () => {
  it('links to the room while it is open', () => {
    render(<JoinRoomButton {...props} now={new Date('2026-11-20T02:05:00.000Z')} />);

    expect(screen.getByRole('link', { name: 'Vào phòng phỏng vấn' })).toHaveAttribute('href', '/interview-room/int-1');
  });

  it('is disabled before the room opens and says when it opens', () => {
    render(<JoinRoomButton {...props} now={new Date('2026-11-20T01:00:00.000Z')} />);

    expect(screen.getByRole('button', { name: 'Vào phòng phỏng vấn' })).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Vào phòng phỏng vấn' })).toBeNull();
    expect(screen.getByText('Phòng mở lúc 08:45')).toBeInTheDocument();
  });

  it('shows nothing once the room has closed', () => {
    const { container } = render(<JoinRoomButton {...props} now={new Date('2026-11-20T04:00:00.000Z')} />);

    expect(container).toBeEmptyDOMElement();
  });
});

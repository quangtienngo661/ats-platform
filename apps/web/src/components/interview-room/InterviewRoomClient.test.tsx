import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { InterviewRoomClient } from './InterviewRoomClient';
import { RoomUnavailable } from './RoomUnavailable';

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';
afterAll(() => {
  process.env.TZ = originalTz;
});

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

// LiveKit's own components need a real browser and server; here only what this page
// hands them and what it does with their callbacks is under test.
const livekit = vi.hoisted(() => ({ roomProps: null as null | Record<string, unknown> }));
vi.mock('@livekit/components-react', () => ({
  PreJoin: (props: { onSubmit: (choices: object) => void; joinLabel: string; defaults: { username: string } }) => (
    <div>
      <p>Thiết bị của {props.defaults.username}</p>
      <button
        type="button"
        onClick={() => props.onSubmit({ videoEnabled: true, audioEnabled: false, videoDeviceId: 'cam-2', audioDeviceId: '', username: 'x' })}
      >
        {props.joinLabel}
      </button>
    </div>
  ),
  LiveKitRoom: (props: Record<string, unknown> & { children: React.ReactNode }) => {
    livekit.roomProps = props;
    return <div data-testid="room">{props.children}</div>;
  },
  VideoConference: () => <p>Hội nghị video</p>,
}));
vi.mock('@livekit/components-styles', () => ({}));

vi.mock('@/servers/interviews/interview-room.action', () => ({ admitCandidateAction: vi.fn() }));
vi.mock('@/stores/useSocketStore', () => ({
  useSocketStore: () => ({ status: 'disconnected', onEvent: vi.fn(), offEvent: vi.fn() }),
}));

const access = {
  status: 'admitted' as const,
  serverUrl: 'ws://localhost:7880',
  token: 'jwt-token',
  roomName: 'interview-int-1',
  identity: 'user-1',
  displayName: 'Nguyễn Ứng Viên',
  role: 'candidate' as const,
  expiresAt: '2026-11-20T03:30:00.000Z',
  waitingCandidate: null,
};

describe('InterviewRoomClient', () => {
  beforeEach(() => {
    push.mockReset();
    livekit.roomProps = null;
  });

  it('checks the devices first and says when the room closes', () => {
    render(<InterviewRoomClient interviewId="int-1" access={access} backHref="/my-interviews" />);

    expect(screen.getByText('Thiết bị của Nguyễn Ứng Viên')).toBeInTheDocument();
    expect(screen.getByText('Phòng đóng lúc 10:30')).toBeInTheDocument();
    expect(screen.queryByTestId('room')).toBeNull();
  });

  it('joins with the token and the devices chosen', async () => {
    const user = userEvent.setup();
    render(<InterviewRoomClient interviewId="int-1" access={access} backHref="/my-interviews" />);

    await user.click(screen.getByRole('button', { name: 'Vào phòng' }));

    expect(screen.getByText('Hội nghị video')).toBeInTheDocument();
    expect(livekit.roomProps).toEqual(
      expect.objectContaining({
        serverUrl: 'ws://localhost:7880',
        token: 'jwt-token',
        connect: true,
        video: { deviceId: 'cam-2' },
        audio: false,
      }),
    );
  });

  it('goes back to the schedule list when the call ends', async () => {
    const user = userEvent.setup();
    render(<InterviewRoomClient interviewId="int-1" access={access} backHref="/interviews" />);
    await user.click(screen.getByRole('button', { name: 'Vào phòng' }));

    (livekit.roomProps?.onDisconnected as () => void)();

    expect(push).toHaveBeenCalledWith('/interviews');
  });
});

describe('RoomUnavailable', () => {
  it('shows why the room cannot be entered and a way back', () => {
    render(<RoomUnavailable message="Bạn không tham gia buổi phỏng vấn này" backHref="/my-interviews" />);

    expect(screen.getByRole('heading', { name: 'Không vào được phòng phỏng vấn' })).toBeInTheDocument();
    expect(screen.getByText('Bạn không tham gia buổi phỏng vấn này')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại lịch phỏng vấn' })).toHaveAttribute('href', '/my-interviews');
  });
});

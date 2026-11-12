import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InterviewRoomGate } from './InterviewRoomGate';
import type {
  IInterviewRoomAccess,
  IInterviewRoomWaiting,
} from '@/types/interfaces/interview-room.interface';

const originalTz = process.env.TZ;
process.env.TZ = 'Asia/Ho_Chi_Minh';
afterAll(() => {
  process.env.TZ = originalTz;
});

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@livekit/components-react', () => ({
  PreJoin: (props: { defaults: { username: string } }) => <p>Thiết bị của {props.defaults.username}</p>,
  LiveKitRoom: () => null,
  VideoConference: () => null,
}));
vi.mock('@livekit/components-styles', () => ({}));

type Listener = (payload: unknown) => void;
const mocks = vi.hoisted(() => ({
  join: vi.fn(),
  admit: vi.fn(),
  listeners: new Map<string, Set<(payload: unknown) => void>>(),
  state: {
    status: 'connected' as 'disconnected' | 'connected',
    onEvent: (name: string, fn: (payload: unknown) => void) => {
      const set = mocks.listeners.get(name) ?? new Set();
      set.add(fn);
      mocks.listeners.set(name, set);
    },
    offEvent: (name: string, fn: (payload: unknown) => void) => {
      mocks.listeners.get(name)?.delete(fn);
    },
  },
}));
vi.mock('@/servers/interviews/interview-room.action', () => ({
  joinInterviewRoomAction: mocks.join,
  admitCandidateAction: mocks.admit,
}));
vi.mock('@/stores/useSocketStore', () => ({
  useSocketStore: Object.assign(
    (selector?: (state: typeof mocks.state) => unknown) => (selector ? selector(mocks.state) : mocks.state),
    { getState: () => mocks.state },
  ),
}));

/** What the server pushes over Socket.IO, delivered to whoever listens now. */
function emit(name: string, payload: unknown) {
  act(() => {
    mocks.listeners.get(name)?.forEach((fn: Listener) => fn(payload));
  });
}

const waiting: IInterviewRoomWaiting = {
  status: 'waiting',
  displayName: 'Nguyễn Ứng Viên',
  since: '2026-11-20T02:05:00.000Z',
  closesAt: '2026-11-20T03:30:00.000Z',
};

const access = (overrides: Partial<IInterviewRoomAccess> = {}): IInterviewRoomAccess => ({
  status: 'admitted',
  serverUrl: 'ws://localhost:7880',
  token: 'jwt-token',
  roomName: 'interview-int-1',
  identity: 'cand-user-1',
  displayName: 'Nguyễn Ứng Viên',
  role: 'candidate',
  expiresAt: '2026-11-20T03:30:00.000Z',
  waitingCandidate: null,
  ...overrides,
});

const interviewerAccess = (waitingCandidate: IInterviewRoomAccess['waitingCandidate'] = null) =>
  access({
    identity: 'interviewer-1',
    displayName: 'Trần Người Phỏng Vấn',
    role: 'interviewer',
    waitingCandidate,
  });

describe('InterviewRoomGate — candidate waiting room (R27)', () => {
  beforeEach(() => {
    mocks.join.mockReset();
    mocks.admit.mockReset();
    mocks.listeners.clear();
    mocks.state.status = 'connected';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a candidate who is not admitted in the waiting room', () => {
    render(<InterviewRoomGate interviewId="int-1" initial={waiting} backHref="/my-interviews" />);

    expect(screen.getByRole('heading', { name: 'Đang chờ người phỏng vấn cho vào' })).toBeInTheDocument();
    expect(screen.getByText('Phòng đóng lúc 10:30')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại lịch phỏng vấn' })).toHaveAttribute('href', '/my-interviews');
    expect(screen.queryByText(/Thiết bị của/)).toBeNull();
  });

  it('moves on to the device check as soon as the interviewer lets the candidate in', async () => {
    mocks.join.mockResolvedValue({ ok: true, room: access() });
    render(<InterviewRoomGate interviewId="int-1" initial={waiting} backHref="/my-interviews" />);

    emit('interview-room:admitted', { interviewId: 'int-1' });

    expect(await screen.findByText('Thiết bị của Nguyễn Ứng Viên')).toBeInTheDocument();
    expect(mocks.join).toHaveBeenCalledWith('int-1');
  });

  it('ignores the admission of another interview', () => {
    render(<InterviewRoomGate interviewId="int-1" initial={waiting} backHref="/my-interviews" />);

    emit('interview-room:admitted', { interviewId: 'int-2' });

    expect(mocks.join).not.toHaveBeenCalled();
  });

  it('checks again on request and keeps waiting while not admitted', async () => {
    const user = userEvent.setup();
    mocks.join.mockResolvedValue({ ok: true, room: waiting });
    render(<InterviewRoomGate interviewId="int-1" initial={waiting} backHref="/my-interviews" />);

    await user.click(screen.getByRole('button', { name: 'Kiểm tra lại' }));

    expect(mocks.join).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Đang chờ người phỏng vấn cho vào' })).toBeInTheDocument();
  });

  it('checks again every 20 seconds in case the socket missed the admission', async () => {
    vi.useFakeTimers();
    mocks.join.mockResolvedValue({ ok: true, room: access() });
    render(<InterviewRoomGate interviewId="int-1" initial={waiting} backHref="/my-interviews" />);

    await act(() => vi.advanceTimersByTimeAsync(19_999));
    expect(mocks.join).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(mocks.join).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Thiết bị của Nguyễn Ứng Viên')).toBeInTheDocument();
  });

  it('shows the reason when the room can no longer be entered', async () => {
    mocks.join.mockResolvedValue({ ok: false, message: 'Buổi phỏng vấn đã kết thúc' });
    render(<InterviewRoomGate interviewId="int-1" initial={waiting} backHref="/my-interviews" />);

    emit('interview-room:admitted', { interviewId: 'int-1' });

    expect(await screen.findByRole('heading', { name: 'Không vào được phòng phỏng vấn' })).toBeInTheDocument();
    expect(screen.getByText('Buổi phỏng vấn đã kết thúc')).toBeInTheDocument();
  });

  it('lets an admitted candidate straight to the device check', () => {
    render(<InterviewRoomGate interviewId="int-1" initial={access()} backHref="/my-interviews" />);

    expect(screen.getByText('Thiết bị của Nguyễn Ứng Viên')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cho vào' })).toBeNull();
  });
});

describe('InterviewRoomGate — interviewer admits (R27)', () => {
  beforeEach(() => {
    mocks.join.mockReset();
    mocks.admit.mockReset();
    mocks.listeners.clear();
  });

  it('shows who has been waiting and lets them in', async () => {
    const user = userEvent.setup();
    mocks.admit.mockResolvedValue({ ok: true });
    render(
      <InterviewRoomGate
        interviewId="int-1"
        initial={interviewerAccess({ name: 'Nguyễn Ứng Viên', since: '2026-11-20T02:05:00.000Z' })}
        backHref="/interviews"
      />,
    );

    expect(screen.getByText('Nguyễn Ứng Viên đang chờ từ 09:05')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cho vào' }));

    expect(mocks.admit).toHaveBeenCalledWith('int-1');
    expect(screen.queryByText(/đang chờ/)).toBeNull();
  });

  it('shows a candidate who starts waiting after the interviewer arrived, until admitted', () => {
    render(<InterviewRoomGate interviewId="int-1" initial={interviewerAccess()} backHref="/interviews" />);
    expect(screen.queryByRole('button', { name: 'Cho vào' })).toBeNull();

    emit('interview-room:waiting', {
      interviewId: 'int-1',
      candidateName: 'Nguyễn Ứng Viên',
      since: '2026-11-20T02:05:00.000Z',
    });
    expect(screen.getByText('Nguyễn Ứng Viên đang chờ từ 09:05')).toBeInTheDocument();

    // Admitted from another tab, or by the other staff member in the interview.
    emit('interview-room:admitted', { interviewId: 'int-1' });
    expect(screen.queryByRole('button', { name: 'Cho vào' })).toBeNull();
  });

  it('asks every 20 seconds who is waiting, in case the socket missed it', async () => {
    vi.useFakeTimers();
    mocks.join.mockResolvedValue({
      ok: true,
      room: interviewerAccess({ name: 'Nguyễn Ứng Viên', since: '2026-11-20T02:05:00.000Z' }),
    });
    render(<InterviewRoomGate interviewId="int-1" initial={interviewerAccess()} backHref="/interviews" />);

    await act(() => vi.advanceTimersByTimeAsync(19_999));
    expect(mocks.join).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(mocks.join).toHaveBeenCalledWith('int-1');
    expect(screen.getByText('Nguyễn Ứng Viên đang chờ từ 09:05')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('ignores a candidate waiting in another interview', () => {
    render(<InterviewRoomGate interviewId="int-1" initial={interviewerAccess()} backHref="/interviews" />);

    emit('interview-room:waiting', { interviewId: 'int-2', candidateName: 'Người Khác', since: '2026-11-20T02:05:00.000Z' });

    expect(screen.queryByText(/đang chờ/)).toBeNull();
  });

  it('keeps the candidate waiting and says why when admitting fails', async () => {
    const user = userEvent.setup();
    mocks.admit.mockResolvedValue({ ok: false, message: 'Buổi phỏng vấn đã kết thúc' });
    render(
      <InterviewRoomGate
        interviewId="int-1"
        initial={interviewerAccess({ name: 'Nguyễn Ứng Viên', since: '2026-11-20T02:05:00.000Z' })}
        backHref="/interviews"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cho vào' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Buổi phỏng vấn đã kết thúc');
    expect(screen.getByText('Nguyễn Ứng Viên đang chờ từ 09:05')).toBeInTheDocument();
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScreeningLiveRefresh } from './useScreeningLiveRefresh';

const mocks = vi.hoisted(() => ({
  router: { refresh: vi.fn() },
  state: {
    status: 'connected' as 'disconnected' | 'connecting' | 'connected' | 'error',
    onEvent: vi.fn<(eventName: string, handler: (payload: unknown) => void) => void>(),
    offEvent: vi.fn<(eventName: string, handler: (payload: unknown) => void) => void>(),
  },
}));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/stores/useSocketStore', () => ({
  useSocketStore: Object.assign(
    (selector?: (state: typeof mocks.state) => unknown) => selector ? selector(mocks.state) : mocks.state,
    { getState: () => mocks.state },
  ),
}));

const eventName = 'cv-screening:completed';

describe('useScreeningLiveRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.router.refresh.mockReset();
    mocks.state.onEvent.mockReset();
    mocks.state.offEvent.mockReset();
    mocks.state.status = 'connected';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('useScreeningLiveRefresh refreshes once for a burst of events within one second', () => {
    renderHook(() => useScreeningLiveRefresh());
    expect(mocks.state.onEvent).toHaveBeenCalledExactlyOnceWith(eventName, expect.any(Function));
    const handler = mocks.state.onEvent.mock.calls[0][1];

    act(() => {
      handler(null);
      handler(null);
      handler(null);
    });
    act(() => { vi.advanceTimersByTime(1000); });

    expect(mocks.router.refresh).toHaveBeenCalledTimes(1);
  });

  it('does nothing until the socket is connected', () => {
    mocks.state.status = 'disconnected';
    const { rerender } = renderHook(() => useScreeningLiveRefresh());
    for (const status of ['disconnected', 'connecting', 'error'] as const) {
      mocks.state.status = status;
      rerender();
      act(() => { vi.advanceTimersByTime(1000); });
      expect(mocks.state.onEvent).not.toHaveBeenCalled();
      expect(mocks.state.offEvent).not.toHaveBeenCalled();
      expect(mocks.router.refresh).not.toHaveBeenCalled();
    }

    mocks.state.status = 'connected';
    rerender();
    expect(mocks.state.onEvent).toHaveBeenCalledExactlyOnceWith(eventName, expect.any(Function));
    const handler = mocks.state.onEvent.mock.calls[0][1];
    act(() => {
      handler(null);
      vi.advanceTimersByTime(1000);
    });
    expect(mocks.router.refresh).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useScreeningLiveRefresh());
    expect(mocks.state.onEvent).toHaveBeenCalledExactlyOnceWith(eventName, expect.any(Function));
    const handler = mocks.state.onEvent.mock.calls[0][1];

    unmount();

    expect(mocks.state.offEvent).toHaveBeenCalledExactlyOnceWith(eventName, handler);
  });
});

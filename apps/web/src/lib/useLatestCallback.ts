'use client';

import { useCallback, useEffect, useRef } from 'react';

/** Effect callbacks see current props without rerunning on each parent render. */
export function useLatestCallback<Args extends unknown[], Result>(callback: (...args: Args) => Result) {
    const ref = useRef(callback);
    useEffect(() => { ref.current = callback; }, [callback]);
    return useCallback((...args: Args) => ref.current(...args), []);
}

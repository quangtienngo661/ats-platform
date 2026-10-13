'use client';

import { createContext, createElement, useContext, useState, type ReactNode } from 'react';
import { useStore, type StoreApi } from 'zustand';

/** Each feature tree owns its store, including its first server/client render. */
export function createRouteStore<State, Initial>(
    createStore: (initial: Initial) => StoreApi<State>,
    name: string,
) {
    const Context = createContext<StoreApi<State> | null>(null);

    function Provider({ initialState, children }: { initialState: Initial; children: ReactNode }) {
        const [store] = useState(() => createStore(initialState));
        return createElement(Context.Provider, { value: store }, children);
    }

    function useRouteStore<Selected>(selector: (state: State) => Selected): Selected {
        const store = useContext(Context);
        if (!store) throw new Error(`${name} requires its route provider`);
        return useStore(store, selector);
    }

    return { Provider, useRouteStore };
}

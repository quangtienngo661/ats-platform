// src/store/useSocketStore.ts
import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';

interface SocketState {
    socket: Socket | null;
    status: 'disconnected' | 'connecting' | 'connected' | 'error';
    socketId: string;
    token: string;
    setToken: (token: string) => void;
    connect: (url: string) => void;
    disconnect: () => void;
    emitEvent: (eventName: string, payload: any) => void;
    onEvent: <T>(eventName: string, callback: (payload: T) => void) => void;
    offEvent: <T>(eventName: string, callback: (payload: T) => void) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    token: "",
    status: 'disconnected',
    socketId: '',
    setToken: (token: string) => {
        set({ token });
    },
    // ── Connect ──────────────────────────────────────────────────────────────────
    connect: (url: string) => {
        if (get().socket?.connected) return;

        set({ status: 'connecting' });
        const token = get().token;
        const socket = io(url, { transports: ['websocket'], auth: { token } });

        socket.on('connect', () => {
            set({ status: 'connected', socketId: socket.id ?? '' });
        });

        socket.on('connect_error', (err) => {
            set({ status: 'error' });
        });

        socket.on('disconnect', () => {
            set({ status: 'disconnected', socketId: '', socket: null });
        });

        set({ socket });
    },

    // ── Disconnect ───────────────────────────────────────────────────────────────
    disconnect: () => {
        const { socket } = get();
        socket?.disconnect();
        set({ socket: null, status: 'disconnected', socketId: '' });
    },

    // ── Emit Custom Event ────────────────────────────────────────────────────────
    emitEvent: (eventName: string, payload: any) => {
        const { socket } = get();
        if (socket) {
            socket.emit(eventName, payload);
        }
    },

    onEvent: <T>(eventName: string, callback: (payload: T) => void) => {
        const { socket } = get();
        if (socket) {
            socket.on(eventName, callback);
        }
    },

    offEvent: <T>(eventName: string, callback: (payload: T) => void) => {
        const { socket } = get();
        if (socket) {
            socket.off(eventName, callback);
        }
    }
}));
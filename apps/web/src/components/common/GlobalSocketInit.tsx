"use client";
import { useEffect } from 'react';
import { useSocketStore } from '@/stores/useSocketStore';
import { SOCKET_URL } from '@/types/constants/urls';

export function GlobalSocketInit({ userId, token }: { userId: string, token: string }) {
    useEffect(() => {
        // 1. Gọi hành động kết nối Socket từ Zustand
        const socketUrl = SOCKET_URL || "";
        const { setToken, connect, disconnect } = useSocketStore.getState();
        setToken(token);
        if (token) {
            connect(socketUrl);
        }

        return () => {
            disconnect();
        };
    }, [token]);

    return null; // Component này vô hình trên màn hình
}   

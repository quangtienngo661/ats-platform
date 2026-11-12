'use client';

import '@livekit/components-styles';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom, PreJoin, VideoConference } from '@livekit/components-react';
import type { LocalUserChoices } from '@livekit/components-react';
import type { IInterviewRoomAccess } from '@/types/interfaces/interview-room.interface';

interface InterviewRoomClientProps {
    access: IInterviewRoomAccess;
    /** Where to go when the call ends: the caller's own schedule list. */
    backHref: string;
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

/**
 * The built-in interview room: a device check first, then LiveKit's ready-made
 * conference (camera, microphone, screen share, chat). The token comes from the API,
 * which already decided this person may be here now.
 */
export function InterviewRoomClient({ access, backHref }: InterviewRoomClientProps) {
    const router = useRouter();
    const [choices, setChoices] = useState<LocalUserChoices | null>(null);

    return (
        <div className="flex h-screen flex-col bg-[#111111]" data-lk-theme="default">
            <header className="flex items-center justify-between px-4 py-3 text-white">
                <h1 className="text-[15px]" style={{ fontWeight: 600 }}>Phòng phỏng vấn</h1>
                <p className="text-[12px] text-white/70">Phòng đóng lúc {formatTime(access.expiresAt)}</p>
            </header>

            <div className="min-h-0 flex-1">
                {choices ? (
                    <LiveKitRoom
                        serverUrl={access.serverUrl}
                        token={access.token}
                        connect
                        video={choices.videoEnabled ? { deviceId: choices.videoDeviceId } : false}
                        audio={choices.audioEnabled ? { deviceId: choices.audioDeviceId } : false}
                        onDisconnected={() => router.push(backHref)}
                        style={{ height: '100%' }}
                    >
                        <VideoConference />
                    </LiveKitRoom>
                ) : (
                    <div className="flex h-full items-center justify-center px-4">
                        <PreJoin
                            defaults={{ username: access.displayName }}
                            joinLabel="Vào phòng"
                            micLabel="Micro"
                            camLabel="Camera"
                            userLabel="Tên hiển thị"
                            persistUserChoices={false}
                            onSubmit={setChoices}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

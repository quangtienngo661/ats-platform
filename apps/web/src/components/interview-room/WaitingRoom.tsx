'use client';

import Link from 'next/link';
import { Hourglass } from 'lucide-react';
import type { IInterviewRoomWaiting } from '@/types/interfaces/interview-room.interface';
import { formatRoomTime } from './room-time';

interface WaitingRoomProps {
    waiting: IInterviewRoomWaiting;
    backHref: string;
    checking: boolean;
    onCheckAgain: () => void;
}

/** The candidate's side of the waiting room (R27): no token, nothing to connect to yet. */
export function WaitingRoom({ waiting, backHref, checking, onCheckAgain }: WaitingRoomProps) {
    return (
        <div className="flex h-screen flex-col bg-[#111111]">
            <header className="flex items-center justify-between px-4 py-3 text-white">
                <p className="text-[15px]" style={{ fontWeight: 600 }}>Phòng phỏng vấn</p>
                <p className="text-[12px] text-white/70">Phòng đóng lúc {formatRoomTime(waiting.closesAt)}</p>
            </header>

            <div className="flex flex-1 items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF5FF]">
                        <Hourglass className="h-6 w-6 text-[#0071E3]" aria-hidden="true" />
                    </div>
                    <h1 className="text-[17px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>
                        Đang chờ người phỏng vấn cho vào
                    </h1>
                    <p className="mt-2 text-[13px] text-[#6E6E73]">
                        Trang tự chuyển sang bước kiểm tra thiết bị khi bạn được cho vào.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                        <button
                            type="button"
                            onClick={onCheckAgain}
                            disabled={checking}
                            className="rounded-xl bg-[#0071E3] px-4 py-2.5 text-[13px] text-white hover:bg-[#0062C4] disabled:opacity-60"
                            style={{ fontWeight: 600 }}
                        >
                            {checking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
                        </button>
                        <Link
                            href={backHref}
                            className="rounded-xl border border-[#E5E5EA] px-4 py-2.5 text-[13px] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                            style={{ fontWeight: 600 }}
                        >
                            Quay lại lịch phỏng vấn
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

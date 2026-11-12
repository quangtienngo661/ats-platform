import Link from 'next/link';
import { VideoOff } from 'lucide-react';

interface RoomUnavailableProps {
    message: string;
    backHref: string;
}

export function RoomUnavailable({ message, backHref }: RoomUnavailableProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-4">
            <div className="w-full max-w-md rounded-2xl border border-[#E5E5EA] bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF2F2]">
                    <VideoOff className="h-6 w-6 text-[#DC2626]" aria-hidden="true" />
                </div>
                <h1 className="text-[17px] text-[#1D1D1F]" style={{ fontWeight: 700 }}>
                    Không vào được phòng phỏng vấn
                </h1>
                <p className="mt-2 text-[13px] text-[#6E6E73]">{message}</p>
                <Link
                    href={backHref}
                    className="mt-5 inline-flex rounded-xl bg-[#0071E3] px-4 py-2.5 text-[13px] text-white hover:bg-[#0062C4]"
                    style={{ fontWeight: 600 }}
                >
                    Quay lại lịch phỏng vấn
                </Link>
            </div>
        </div>
    );
}

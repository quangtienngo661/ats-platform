import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';

// Full-screen room for candidates and staff alike. Signed-in check only; whether this
// person is in the interview, and whether the room is open, is the API's decision.
export default async function InterviewRoomLayout({ children }: { children: ReactNode }) {
    const token = (await cookies()).get('accessToken')?.value ?? '';
    if (!token || !decodeTokenPayload(token)) redirect('/sign-in');

    return (
        <main id="main-content" className="h-screen w-screen overflow-hidden">
            {children}
        </main>
    );
}

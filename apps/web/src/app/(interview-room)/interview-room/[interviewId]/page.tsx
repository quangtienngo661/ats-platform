import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { decodeTokenPayload } from '@/lib/decodeTokenPayload';
import { joinInterviewRoomAction } from '@/servers/interviews/interview-room.action';
import { InterviewRoomClient } from '@/components/interview-room/InterviewRoomClient';
import { RoomUnavailable } from '@/components/interview-room/RoomUnavailable';

export const metadata: Metadata = { title: 'Phòng phỏng vấn' };

export default async function InterviewRoomPage({ params }: { params: Promise<{ interviewId: string }> }) {
    const { interviewId } = await params;
    const role = decodeTokenPayload((await cookies()).get('accessToken')?.value ?? '')?.role;
    const backHref = role === 'candidate' ? '/my-interviews' : '/interviews';

    const result = await joinInterviewRoomAction(interviewId);
    if (!result.ok) return <RoomUnavailable message={result.message} backHref={backHref} />;

    return <InterviewRoomClient access={result.access} backHref={backHref} />;
}

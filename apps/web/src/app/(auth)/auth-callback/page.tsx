import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface AuthCallbackPageProps {
    searchParams: Promise<{ token?: string; error?: string }>;
}
export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
    const { token, error } = await searchParams;

    if (error || !token) {
        redirect('/sign-in?error=oauth_failed');
    }

    // Set the accessToken cookie (same options as signInAction)
    const cookieStore = await cookies();
    cookieStore.set({
        name: 'accessToken',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    redirect('/dashboard');
}

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SERVER_URL } from './types/constants/urls';
import { privatePaths, roleProtectedPaths, landingForRole, mayVisit } from './lib/role-policy';
import { decodeTokenPayload } from './lib/decodeTokenPayload';

// ── Helpers ──────────────────────────────────────────────────────────────────
function isTokenExpired(token: string): boolean {
    const payload = decodeTokenPayload(token);
    if (!payload?.exp) return true;
    return payload.exp < Math.floor(Date.now() / 1000);
}

async function tryRefreshToken(currentRefreshToken: string) {
    try {
        const res = await fetch(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/refresh`, {
            method: 'POST',
            headers: { Cookie: `refreshToken=${currentRefreshToken}` },
        });

        if (!res.ok) return null;
        const cookieStr = res.headers.getSetCookie().find(cookie => cookie.startsWith('refreshToken='));
        const newRefreshToken = cookieStr?.match(/refreshToken=([^;]+)/)?.[1];
        const data = await res.json();
        return { newAccessToken: data.data?.accessToken ?? null, newRefreshToken };
    } catch {
        return null;
    }
}

// ── Route Config ─────────────────────────────────────────────────────────────

const authPaths = ['/sign-in', '/register'];

// Các trang chỉ dành cho guest (chưa đăng nhập)
// Nếu đã đăng nhập cố vào → redirect về /sign-in (không kèm query params)
const guestOnlyPaths = [
    '/reset-password',
    '/verify-email',
    '/forgot-password',
    '/verification-success',
];

function privateRouteResponse(request: NextRequest, token: string, headers?: Headers) {
    const role = decodeTokenPayload(token)?.role;
    if (!role) return NextResponse.redirect(new URL('/sign-in', request.url));

    if (!mayVisit(role, request.nextUrl.pathname)) {
        const fallback = role === 'candidate' ? '/'
            : role === 'org_admin' ? '/department-management' : role === 'admin' || role === 'recruiter' ? '/dashboard' : '/403';
        return NextResponse.redirect(new URL(fallback, request.url));
    }
    return NextResponse.next(headers ? { request: { headers } } : undefined);
}

// ── Proxy ────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    const isPrivatePath = privatePaths.some(p => pathname.startsWith(p));
    const isAuthPath = authPaths.some(p => pathname.startsWith(p));
    const isGuestOnlyPath = guestOnlyPaths.some(p => pathname.startsWith(p));

    const accessToken = request.cookies.get('accessToken')?.value;
    const refreshToken = request.cookies.get('refreshToken')?.value;

    const isSessionExpired = request.nextUrl.searchParams.get('session_expired') === 'true';

    if (isAuthPath && isSessionExpired) {
        const response = NextResponse.next();
        response.cookies.delete('accessToken');
        response.cookies.delete('refreshToken');
        return response; // Cho phép vào rỗng login, dọn sạch cookie hỏng
    }

    // ── KỊCH BẢN: Trang Auth khi đã có token ──
    if (isAuthPath && accessToken && !isTokenExpired(accessToken) && !isSessionExpired) {
        return NextResponse.redirect(new URL(landingForRole(decodeTokenPayload(accessToken)?.role), request.url));
    }

    // ── KỊCH BẢN: Trang Guest-Only → đã đăng nhập thì redirect về dashboard ──
    if (isGuestOnlyPath && accessToken && !isTokenExpired(accessToken)) {
        return NextResponse.redirect(new URL(landingForRole(decodeTokenPayload(accessToken)?.role), request.url));
    }

    // ── KỊCH BẢN: Trang Public → cho qua ──
    if (!isPrivatePath) {
        return NextResponse.next();
    }

    // ── Từ đây: Chắc chắn là Private Route ──────────────────────────────────

    // CASE 1: Có accessToken còn hạn → kiểm tra role rồi cho đi tiếp
    if (accessToken && !isTokenExpired(accessToken)) {
        return privateRouteResponse(request, accessToken);
    }

    // CASE 2: accessToken hết hạn hoặc không có → thử refresh
    if (refreshToken) {
        const refreshResult = await tryRefreshToken(refreshToken);

        if (!refreshResult || !refreshResult.newAccessToken) {
            return NextResponse.redirect(
                new URL(`/sign-in?session_expired=true&callbackUrl=${request.url}`, request.url)
            );
        }
        const { newAccessToken, newRefreshToken } = refreshResult;
        const requestHeaders = new Headers(request.headers);
        request.cookies.set('accessToken', newAccessToken);
        if (newRefreshToken) request.cookies.set('refreshToken', newRefreshToken);
        // Server components read cookies(), so the current request needs both
        // refreshed cookies before NextResponse snapshots the forwarded headers.
        requestHeaders.set('Cookie', request.cookies.toString());
        requestHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        const response = privateRouteResponse(request, newAccessToken, requestHeaders);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: '/',
        };
        response.cookies.set('accessToken', newAccessToken, cookieOptions);
        if (newRefreshToken) response.cookies.set('refreshToken', newRefreshToken, cookieOptions);
        return response;
    }

    // CASE 3: Không có gì cả → chưa đăng nhập
    if (roleProtectedPaths.candidate.includes(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.redirect(new URL('/sign-in/admin', request.url));
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

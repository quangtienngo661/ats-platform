// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SERVER_URL } from './types/constants/urls';
import { decodeTokenPayload } from './lib/decodeTokenPayload';

// ── Helpers ──────────────────────────────────────────────────────────────────
function isTokenExpired(token: string): boolean {
    const payload = decodeTokenPayload(token);
    if (!payload?.exp) return true;
    return payload.exp < Math.floor(Date.now() / 1000);
}

async function tryRefreshToken(currentRefreshToken: string) {
    try {
        const res = await fetch(`${SERVER_URL}/auth/refresh`, {
            method: 'POST',
            headers: { Cookie: `refreshToken=${currentRefreshToken}` },
        });

        let newRefreshToken;

        const cookieStr = res.headers.getSetCookie()[0];
        if (cookieStr) {
            if (cookieStr.startsWith('refreshToken=')) {
                const match = cookieStr.match(/refreshToken=([^;]+)/);
                if (match && match[1]) {
                    newRefreshToken = match[1];
                }
            }
        }

        if (!res.ok) return null;
        const data = await res.json();
        // Tùy response shape của backend
        return { newAccessToken: data.data.accessToken ?? null, newRefreshToken: newRefreshToken || "" };
    } catch {
        return null;
    }
}

// ── Route Config ─────────────────────────────────────────────────────────────

const privatePaths = [
    // Admin routes
    '/department-management',
    '/ai-configuration',
    '/user-management',
    '/skill-management',
    '/company-profile',
    '/job-category-management',
    '/ai-usage-logs',
    // Recruiter routes
    '/dashboard',
    '/jobs',
    '/interviews',
    // Candidate routes
    '/my-applications',
    '/my-cvs',
    '/profile',
];
const authPaths = ['/sign-in', '/register'];

// Các trang chỉ dành cho guest (chưa đăng nhập)
// Nếu đã đăng nhập cố vào → redirect về /sign-in (không kèm query params)
const guestOnlyPaths = [
    '/reset-password',
    '/verify-email',
    '/forgot-password',
    '/verification-success',
];

// Role-based route protection
const roleProtectedPaths: Record<string, string[]> = {
    recruiter: [
        '/dashboard',
        '/jobs',
        '/interviews',
    ],
    admin: [
        '/department-management',
        '/ai-configuration',
        '/user-management',
        '/skill-management',
        '/company-profile',
        '/job-category-management',
        '/ai-usage-logs',
        '/dashboard',
        '/jobs',
    ],
    candidate: [
        '/job-postings',
        '/my-applications',
        '/my-cvs',
        '/profile',
    ],
};

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
        return NextResponse.redirect(new URL('/department-management', request.url));
    }

    // ── KỊCH BẢN: Trang Guest-Only → đã đăng nhập thì đá về /sign-in ──
    if (isGuestOnlyPath && accessToken && !isTokenExpired(accessToken)) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // if (isGuestOnlyPath && !accessToken) {
    //     return NextResponse.redirect(new URL('/sign-in', request.url));
    // }

    // ── KỊCH BẢN: Trang Public → cho qua ──
    if (!isPrivatePath) {
        return NextResponse.next();
    }



    // ── Từ đây: Chắc chắn là Private Route ──────────────────────────────────

    // CASE 1: Có accessToken còn hạn → kiểm tra role rồi cho đi tiếp
    if (accessToken && !isTokenExpired(accessToken)) {
        const payload = decodeTokenPayload(accessToken);
        const userRole = payload?.role;

        // Token không chứa role → bất thường, đá về login
        if (!userRole) {
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        // Lấy danh sách paths được phép của role hiện tại
        const allowedPaths = roleProtectedPaths[userRole] || [];

        // Kiểm tra path hiện tại có nằm trong danh sách cho phép không
        const isAllowed = allowedPaths.some(p => pathname.startsWith(p));

        if (!isAllowed) {
            // Redirect về trang chủ phù hợp với từng role
            if (userRole === 'candidate') {
                return NextResponse.redirect(new URL('/job-postings', request.url));
            }
            if (userRole === 'admin' || userRole === 'recruiter') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }
            // Fallback cho các role không xác định
            return NextResponse.redirect(new URL('/403', request.url));
        }

        return NextResponse.next();
    }

    // CASE 2: accessToken hết hạn hoặc không có → thử refresh
    if (refreshToken) {
        const refreshResult = await tryRefreshToken(refreshToken);

        if (!refreshResult || !refreshResult.newAccessToken) {
            return NextResponse.redirect(
                new URL(`/sign-in?session_expired=true&callbackUrl=${request.url}`, request.url)
            );
        }
        // Lúc này TypeScript biết chắc chắn nó là Object rồi, tha hồ bóc tách
        const { newAccessToken, newRefreshToken } = refreshResult;

        if (newAccessToken) {
            const requestHeaders = new Headers(request.headers);
            const response = NextResponse.next({
                request: { headers: requestHeaders },
            });

            // Gắn token mới vào header của request tiếp theo
            requestHeaders.set('Authorization', `Bearer ${newAccessToken}`);

            // Ghi cookie mới về browser
            response.cookies.set({
                name: 'accessToken',
                value: newAccessToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });

            response.cookies.set({
                name: 'refreshToken',
                value: newRefreshToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });

            return response;
        }

        // refreshToken hết hạn / lỗi → đá ra
        return NextResponse.redirect(
            new URL(`/sign-in?session_expired=true&callbackUrl=${request.url}`, request.url)
        );
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

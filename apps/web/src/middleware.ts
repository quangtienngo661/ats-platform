// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SERVER_URL } from './types/constants/urls';

// ── Helpers ──────────────────────────────────────────────────────────────────

function decodeTokenPayload(token: string): { exp?: number; role?: string } | null {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

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
        return { newAccessToken: data?.data?.accessToken ?? data?.accessToken ?? null, newRefreshToken: newRefreshToken || "" };
    } catch {
        return null;
    }
}

// ── Route Config ─────────────────────────────────────────────────────────────

const privatePaths = ['/department-management', '/ai-configuration', '/dashboard', '/user-management'];
const authPaths = ['/sign-in', '/register'];

// Role-based route protection (tùy chọn)
const roleProtectedPaths: Record<string, string[]> = {
    admin: ['/department-management', '/ai-configuration', '/user-management'],
    // recruiter: ['/jobs', '/applications'],
};

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    const isPrivatePath = privatePaths.some(p => pathname.startsWith(p));
    const isAuthPath = authPaths.some(p => pathname.startsWith(p));

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

    // ── KỊCH BẢN: Trang Public → cho qua ──
    if (!isPrivatePath) {
        return NextResponse.next();
    }

    // ── Từ đây: Chắc chắn là Private Route ──────────────────────────────────

    // CASE 1: Có accessToken còn hạn → cho đi tiếp ngay
    if (accessToken && !isTokenExpired(accessToken)) {
        // (Tùy chọn) Role-based authorization
        const payload = decodeTokenPayload(accessToken);
        for (const [role, paths] of Object.entries(roleProtectedPaths)) {
            const isRoleProtected = paths.some(p => pathname.startsWith(p));
            if (isRoleProtected && payload?.role !== role) {
                // Chuyển hướng người dùng sang trang 403 hoặc trang chủ nếu không có quyền
                return NextResponse.redirect(new URL('/403', request.url));
                // Nếu bạn muốn hiển thị toast, hãy redirect dạng: 
                // return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
                // Rồi để Client Component (dashboard) đọc URL param mà hiện toast.
            }
        }

        return NextResponse.next();
    }

    // CASE 2: accessToken hết hạn hoặc không có → thử refresh
    if (refreshToken) {
        const refreshResult = await tryRefreshToken(refreshToken);

        if (!refreshResult || !refreshResult.newAccessToken) {
            console.log(request.url);

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
    return NextResponse.redirect(new URL('/sign-in', request.url));
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

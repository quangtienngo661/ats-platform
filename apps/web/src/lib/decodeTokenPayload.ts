import { jwtDecode } from 'jwt-decode';

interface CustomJwtPayload {
    userId: string;
    role: string;
    fullName: string;
    iat?: number;
    exp?: number;
}

export function decodeTokenPayload(token: string): CustomJwtPayload | null {
    try {
        const payload = jwtDecode<CustomJwtPayload>(token);
        return payload;
    } catch (error: any) {
        console.error("Token không hợp lệ:", error);
        return null;
    }
}


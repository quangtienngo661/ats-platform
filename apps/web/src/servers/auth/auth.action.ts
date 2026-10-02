"use server";

import { decodeTokenPayload } from "@/lib/decodeTokenPayload";
import { safeCallbackPath } from "@/lib/safe-callback-url";
import { SERVER_URL } from "@/types/constants/urls";
import axios, { AxiosResponse } from "axios";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { actionErrorMessage, apiErrorResponse } from "@/lib/action-error";

// -------------- Helpers ----------------
const getAccessToken = async (payload: RequestPayload) => {
    const response = await axios.post(
        `${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/login`,
        payload
    );


    let accessToken = null;
    if (response.data?.data?.accessToken) {
        accessToken = response.data.data.accessToken;
    } else if (response.data?.accessToken) {
        accessToken = response.data.accessToken;
    }

    return { response, accessToken }
}

const setAuthCookies = async (accessToken: string, response: AxiosResponse) => {
    const cookiesStore = await cookies();

    cookiesStore.set({
        name: "accessToken",
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
        setCookieHeader.forEach(cookieStr => {
            if (cookieStr.startsWith('refreshToken=')) {
                const match = cookieStr.match(/refreshToken=([^;]+)/);
                if (match && match[1]) {
                    cookiesStore.set({
                        name: "refreshToken",
                        value: match[1],
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: "strict",
                        path: "/",
                    });
                }
            }
        });
    }
}

interface RequestPayload {
    email: string,
    password: string
}


// Định nghĩa kiểu dữ liệu trả về cho Form State
export type AuthState = {
    success: boolean;
    message: string;
};

// Giữ lại SignInState cho tương thích ngược
export type SignInState = AuthState;


export async function signInAction(
    prevState: SignInState,
    formData: FormData
): Promise<SignInState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    let isRoleDifferent = false;
    let authenticatedRole: string | undefined;

    const payload = {
        email,
        password,
    };

    if (!email || !password) {
        return { success: false, message: "Vui lòng nhập đầy đủ thông tin" };
    }

    try {
        const { accessToken, response } = await getAccessToken(payload);

        if (accessToken) {
            const tokenPayload = decodeTokenPayload(accessToken);
            authenticatedRole = tokenPayload?.role;

            if (tokenPayload?.role === role || (tokenPayload?.role === "admin" && role === "recruiter")) {
                await setAuthCookies(accessToken, response);
            }

            else if ((tokenPayload?.role === "admin" || tokenPayload?.role === "recruiter") && role === "candidate") {
                isRoleDifferent = true;
            } else {
                return { success: false, message: "Tài khoản của bạn không có quyền truy cập portal này" };
            }
        }
        else return { success: false, message: "Đăng nhập thất bại" };
    } catch (error) {
        const rawMsg = actionErrorMessage(error, "Sai tài khoản hoặc mật khẩu");

        // Email chưa xác thực → redirect đến trang verify-email
        if (rawMsg.startsWith('EMAIL_NOT_VERIFIED:')) {
            const email = rawMsg.split(':')[1] ?? '';
            redirect(`/verify-email?email=${encodeURIComponent(email)}&type=verify`);
        }

        return { success: false, message: rawMsg };
    }
    const callbackUrl = safeCallbackPath(formData.get("callbackUrl"));

    if (isRoleDifferent) {
        const query = new URLSearchParams({ isRoleDifferent: 'true' });
        if (callbackUrl) query.set('callbackUrl', callbackUrl);
        redirect(`/sign-in/admin?${query.toString()}`);
    }

    if (callbackUrl) {
        redirect(callbackUrl);
    }

    if (authenticatedRole === "candidate") {
        redirect("/job-postings");
    }

    if (authenticatedRole === "org_admin") redirect("/department-management");

    redirect("/dashboard");
}

export async function registerAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    const payload = { email, password, fullName };

    if (!email || !password || !fullName) {
        return { success: false, message: "Vui lòng nhập đầy đủ thông tin" };
    }

    try {
        await axios.post(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/register`, payload);
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, "Đăng ký thất bại") };
    }

    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function refreshAction(): Promise<AuthState> {
    try {
        const cookiesStore = await cookies();
        const refreshToken = cookiesStore.get("refreshToken")?.value;

        const response = await axios.post(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/refresh`, {}, {
            headers: refreshToken ? { Cookie: `refreshToken=${refreshToken}` } : undefined
        });

        let accessToken = null;
        if (response.data?.data?.accessToken) {
            accessToken = response.data.data.accessToken;
        } else if (response.data?.accessToken) {
            accessToken = response.data.accessToken;
        }

        if (accessToken) {
            cookiesStore.set({
                name: "accessToken",
                value: accessToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            });
            return { success: true, message: "Làm mới phiên thành công" };
        }

        return { success: false, message: "Không thể lấy token mới" };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, "Làm mới token thất bại") };
    }
}

export async function logoutAction(
    redirectTo = "/sign-in"
): Promise<AuthState> {
    try {
        const cookiesStore = await cookies();
        const accessToken = cookiesStore.get("accessToken")?.value;

        // Gọi API logout
        const refreshToken = cookiesStore.get("refreshToken")?.value;
        await axios.post(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/logout`, {}, {
            headers: {
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                ...(refreshToken ? { Cookie: `refreshToken=${refreshToken}` } : {}),
            },
        });

        // Xoá cookie
        cookiesStore.delete("accessToken");
        cookiesStore.delete("refreshToken");

    } catch (error) {
        // Dù lỗi cũng xoá cookie local
        const cookiesStore = await cookies();
        cookiesStore.delete("accessToken");
        cookiesStore.delete("refreshToken");

        return { success: false, message: actionErrorMessage(error, "Đăng xuất có lỗi nhưng đã xoá session ở client") };
    }

    // Redirect cần để ra ngoài try/catch
    redirect(safeCallbackPath(redirectTo) ?? "/sign-in");
}

export async function requestEmailVerificationAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const email = formData.get("email") as string;
    const type = formData.get("type") as string;

    if (!email) {
        return { success: false, message: "Vui lòng nhập email" };
    }

    try {
        await axios.post(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/request-email-verification`, { email, type });
        return { success: true, message: "Email xác thực đã được gửi" };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, "Không thể gửi email xác thực") };
    }
}

export async function verifyEmailAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const token = formData.get("token") as string;
    const type = formData.get("type") as string;
    if (!token) return { success: false, message: "Mã xác thực không hợp lệ" };

    let destination: string | undefined;
    try {
        const response = await axios.get(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/verify-email`, {
            params: { token, type }, maxRedirects: 0,
        });
        destination = response.data?.url;
    } catch (error) {
        unstable_rethrow(error);
        const response = apiErrorResponse(error);
        if (response?.status === 302 && response.headers?.location) {
            destination = response.headers.location;
        } else {
            return { success: false, message: actionErrorMessage(error, "Xác thực email thất bại") };
        }
    }

    if (destination) {
        // The API supplies an absolute CLIENT_URL; navigate locally to its known verification routes.
        let path: string | null = null;
        try {
            const url = new URL(destination, 'https://talentai.local');
            if (['/reset-password', '/verification-success', '/verify-email', '/sign-in'].includes(url.pathname)) {
                path = safeCallbackPath(url.pathname + url.search);
            }
        } catch { /* Invalid destinations are reported to the form. */ }
        if (!path) return { success: false, message: "Đường dẫn xác thực không hợp lệ" };
        redirect(path);
    }
    return { success: true, message: "Xác thực email thành công" };
}

export async function forgotPasswordAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const email = formData.get("email") as string;

    if (!email) {
        return { success: false, message: "Vui lòng nhập email" };
    }

    try {
        await axios.post(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/forgot-password`, { email });
        return { success: true, message: "Email khôi phục mật khẩu đã được gửi" };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, "Không thể gửi email khôi phục mật khẩu") };
    }
}

export async function resetPasswordAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;

    if (!token || !password) {
        return { success: false, message: "Vui lòng nhập đầy đủ thông tin" };
    }

    try {
        await axios.post(`${process.env.API_INTERNAL_URL ?? SERVER_URL}/auth/reset-password`, { token, password });
        return { success: true, message: "Đặt lại mật khẩu thành công" };
    } catch (error) {
        return { success: false, message: actionErrorMessage(error, "Đặt lại mật khẩu thất bại") };
    }
}

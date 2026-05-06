"use server";

import { decodeTokenPayload } from "@/lib/decodeTokenPayload";
import { SERVER_URL } from "@/types/constants/urls";
import axios, { AxiosResponse } from "axios";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// -------------- Helpers ----------------
const getAccessToken = async (payload: RequestPayload) => {
    const response = await axios.post(
        `${SERVER_URL}/auth/login`,
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

            if (tokenPayload?.role === role || (tokenPayload?.role === "admin" && role === "recruiter")) {
                await setAuthCookies(accessToken, response);
            }

            else if ((tokenPayload?.role === "admin" || tokenPayload?.role === "recruiter") && role === "candidate") {
                isRoleDifferent = true;
            } else {
                return { success: false, message: "Tài khoản của bạn không có quyền truy cập portal này" };
            }
        }
    } catch (error: any) {
        const msg: string = error.response?.data?.message || "Sai tài khoản hoặc mật khẩu";
        const rawMsg = Array.isArray(msg) ? msg[0] : msg;

        // Email chưa xác thực → redirect đến trang verify-email
        if (rawMsg.startsWith('EMAIL_NOT_VERIFIED:')) {
            const email = rawMsg.split(':')[1] ?? '';
            redirect(`/verify-email?email=${encodeURIComponent(email)}&type=verify`);
        }

        return { success: false, message: rawMsg };
    }
    const callbackUrl = formData.get("callbackUrl");

    if (isRoleDifferent) {
        redirect(`/sign-in/admin?isRoleDifferent=true${callbackUrl ? `&callbackUrl=${callbackUrl as string}` : ""}`);
    }

    if (callbackUrl) {
        redirect(callbackUrl as string)
    }

    if (role === "candidate") {
        redirect("/job-postings");
    }

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
        await axios.post(`${SERVER_URL}/auth/register`, payload);
    } catch (error: any) {
        const msg = error.response?.data?.message || "Đăng ký thất bại";
        return { success: false, message: Array.isArray(msg) ? msg[0] : msg };
    }

    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

export async function refreshAction(): Promise<AuthState> {
    try {
        const cookiesStore = await cookies();
        const refreshToken = cookiesStore.get("refreshToken")?.value;

        const response = await axios.post(`${SERVER_URL}/auth/refresh`, {}, {
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
    } catch (error: any) {
        const msg = error.response?.data?.message || "Làm mới token thất bại";
        return { success: false, message: Array.isArray(msg) ? msg[0] : msg };
    }
}

export async function logoutAction(
    redirectTo: string = "/sign-in"
): Promise<AuthState> {
    try {
        const cookiesStore = await cookies();
        const accessToken = cookiesStore.get("accessToken")?.value;

        // Gọi API logout
        await axios.post(`${SERVER_URL}/auth/logout`, {}, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
        });

        // Xoá cookie
        cookiesStore.delete("accessToken");
        cookiesStore.delete("refreshToken");

    } catch (error: any) {
        // Dù lỗi cũng xoá cookie local
        const cookiesStore = await cookies();
        cookiesStore.delete("accessToken");
        cookiesStore.delete("refreshToken");

        const msg = error.response?.data?.message || "Đăng xuất có lỗi nhưng đã xoá session ở client";
        return { success: false, message: Array.isArray(msg) ? msg[0] : msg };
    }

    // Redirect cần để ra ngoài try/catch
    redirect(redirectTo);
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
        await axios.post(`${SERVER_URL}/auth/request-email-verification`, { email, type });
        return { success: true, message: "Email xác thực đã được gửi" };
    } catch (error: any) {
        const msg = error.response?.data?.message || "Không thể gửi email xác thực";
        return { success: false, message: Array.isArray(msg) ? msg[0] : msg };
    }
}

export async function verifyEmailAction(
    prevState: AuthState,
    formData: FormData
): Promise<AuthState> {
    const token = formData.get("token") as string;
    const type = formData.get("type") as string;

    if (!token) {
        return { success: false, message: "Mã xác thực không hợp lệ" };
    }

    try {
        const response = await axios.get(`${SERVER_URL}/auth/verify-email`, {
            params: { token, type },
            maxRedirects: 0, // Không follow redirect, lấy response data
        });
        const redirectUrl: string | undefined = response.data?.url;

        // Nếu backend trả về redirectUrl (type=reset), redirect bằng Next.js
        if (redirectUrl) {
            redirect(redirectUrl);
        }

        return { success: true, message: "Xác thực email thành công" };
    } catch (error: any) {
        // axios ném lỗi khi gặp status 3xx nếu maxRedirects=0 — bắt redirect URL từ đây
        if (error.response?.status === 302 && error.response?.headers?.location) {
            redirect(error.response.headers.location);
        }
        const msg = error.response?.data?.message || "Xác thực email thất bại";
        return { success: false, message: Array.isArray(msg) ? msg[0] : msg };
    }
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
        await axios.post(`${SERVER_URL}/auth/forgot-password`, { email });
        return { success: true, message: "Email khôi phục mật khẩu đã được gửi" };
    } catch (error: any) {
        const msg = error.response?.data?.message || "Không thể gửi email khôi phục mật khẩu";
        return { success: false, message: Array.isArray(msg) ? msg[0] : msg };
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
        await axios.post(`${SERVER_URL}/auth/reset-password`, { token, password });
        return { success: true, message: "Đặt lại mật khẩu thành công" };
    } catch (error: any) {
        const msg = error.response?.data?.message || "Đặt lại mật khẩu thất bại";
        return { success: false, message: Array.isArray(msg) ? msg[0] : msg };
    }
}

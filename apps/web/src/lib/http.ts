import axios from "axios";
import { cookies } from "next/headers";
import { SERVER_URL } from "@/types/constants/urls";
import { redirect } from "next/navigation";


const http = axios.create({
    baseURL: SERVER_URL,
    withCredentials: true,
});

http.interceptors.request.use(async (config) => {
    const cookiesStore = await cookies();
    const token = cookiesStore.get("accessToken")?.value;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            redirect('/sign-in?session_expired=true');
        }
        return Promise.reject(error);
    }
)

export default http;
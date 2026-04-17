"use server";

import { revalidatePath } from "next/cache";
import { ConfigProfile } from "@/types/interfaces/configProfile.interface";
import http from "@/lib/http";
import { IAiConfig } from "@ats-platform/types";

// ─── Kiểu trả về chuẩn cho mọi action ───────────────────────────────────────
export type ActionResult<T = undefined> =
    | { success: true; data?: T }
    | { success: false; error: string };

// ─── Converters ──────────────────────────────────────────────────────────────
const convertToUI = async (data: IAiConfig | IAiConfig[]): Promise<ConfigProfile | ConfigProfile[]> => {
    if (Array.isArray(data)) {
        return data.map((item) => ({
            ...item,
            configId: item.configId!,
            collapsed: item.isDefault ? false : true,
            skillsWeight: Number(item.skillsWeight) * 100,
            experienceWeight: Number(item.experienceWeight) * 100,
            educationWeight: Number(item.educationWeight) * 100,
            minimumScoreThreshold: Number(item.minimumScoreThreshold),
        }));
    }
    return {
        ...data,
        configId: data.configId!,
        collapsed: data.isDefault ? false : true,
        skillsWeight: Number(data.skillsWeight) * 100,
        experienceWeight: Number(data.experienceWeight) * 100,
        educationWeight: Number(data.educationWeight) * 100,
        minimumScoreThreshold: Number(data.minimumScoreThreshold),
    };
};

const convertToAPI = async (data: ConfigProfile): Promise<IAiConfig> => {
    return {
        ...data,
        skillsWeight: Number(data.skillsWeight) / 100,
        experienceWeight: Number(data.experienceWeight) / 100,
        educationWeight: Number(data.educationWeight) / 100,
        minimumScoreThreshold: Number(data.minimumScoreThreshold),
    };
};

// ─── 1. Lấy danh sách ────────────────────────────────────────────────────────
export async function getAIConfigAction(): Promise<ConfigProfile[]> {
    const profiles = await http.get(`/ai-config`);
    return await convertToUI(profiles.data) as ConfigProfile[];
}

// ─── 2. Thêm mới ─────────────────────────────────────────────────────────────
export async function addAIConfigAction(
    profile: Omit<ConfigProfile, 'collapsed'>
): Promise<ActionResult<ConfigProfile>> {
    try {
        const payload = await convertToAPI(profile);
        const res = await http.post(`/ai-config`, payload);
        const created = await convertToUI(res.data) as ConfigProfile;
        revalidatePath("/ai-configuration");
        return { success: true, data: created };
    } catch {
        return { success: false, error: 'Không thể tạo cấu hình mới' };
    }
}

// ─── 3. Cập nhật ─────────────────────────────────────────────────────────────
export async function updateAIConfigAction(
    updated: Omit<ConfigProfile, 'collapsed'>
): Promise<ActionResult<ConfigProfile>> {
    try {
        const updatedInfo: IAiConfig = {
            name: updated.name,
            description: updated.description,
            isDefault: updated.isDefault,
            skillsWeight: updated.skillsWeight,
            experienceWeight: updated.experienceWeight,
            educationWeight: updated.educationWeight,
            minimumScoreThreshold: updated.minimumScoreThreshold,
        }
        const payload = await convertToAPI(updatedInfo);
        const res = await http.patch(`/ai-config/${updated.configId}`, payload);
        const saved = await convertToUI(res.data) as ConfigProfile;
        revalidatePath("/ai-configuration");
        return { success: true, data: saved };
    } catch (e) {
        return { success: false, error: 'Không thể cập nhật cấu hình' };
    }
}

// ─── 4. Xóa ──────────────────────────────────────────────────────────────────
export async function deleteAIConfigAction(
    configId: string
): Promise<ActionResult> {
    try {
        await http.delete(`/ai-config/${configId}`);
        revalidatePath("/ai-configuration");
        return { success: true };
    } catch {
        return { success: false, error: 'Không thể xóa cấu hình này' };
    }
}

// ─── 5. Đặt mặc định ─────────────────────────────────────────────────────────
export async function setDefaultAIConfigAction(
    configId: string
): Promise<ActionResult<ConfigProfile>> {
    try {
        const res = await http.patch(`/ai-config/${configId}/set-default`);
        const updated = await convertToUI(res.data) as ConfigProfile;
        revalidatePath("/ai-configuration");
        return { success: true, data: updated };
    } catch {
        return { success: false, error: 'Không thể đặt cấu hình mặc định' };
    }
}

// ─── 6. Nhân bản ─────────────────────────────────────────────────────────────
export async function duplicateAIConfigAction(
    configId: string
): Promise<ActionResult<ConfigProfile>> {
    try {
        const existing = await http.get(`/ai-config/${configId}`);

        const duplicatedProfile: IAiConfig = {
            name: `${existing.data.name} (bản sao)`,
            description: existing.data.description,
            isDefault: false,
            skillsWeight: Number(existing.data.skillsWeight),
            experienceWeight: Number(existing.data.experienceWeight),
            educationWeight: Number(existing.data.educationWeight),
            minimumScoreThreshold: Number(existing.data.minimumScoreThreshold),
        };

        const res = await http.post(`/ai-config`, duplicatedProfile);
        const created = await convertToUI(res.data) as ConfigProfile;
        revalidatePath("/ai-configuration");
        return { success: true, data: created };
    } catch {
        return { success: false, error: 'Không thể nhân bản cấu hình này' };
    }
}
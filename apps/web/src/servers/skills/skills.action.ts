'use server';

import http from '@/lib/http';
import { revalidatePath } from 'next/cache';
import { ISkillDto } from '@/types/interfaces/skill.interface';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillActionState = {
    success: boolean;
    message: string;
    data?: ISkillDto;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosErr = error as { response?: { data?: { message?: string | string[] } } };
        const msg = axiosErr.response?.data?.message;
        if (msg) return Array.isArray(msg) ? msg[0] : msg;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

// ─── GET ALL SKILLS ───────────────────────────────────────────────────────────
export async function getSkillsAction(): Promise<ISkillDto[]> {
    try {
        const response = await http.get('/skills');
        return response.data as ISkillDto[];
    } catch {
        return [];
    }
}

// ─── SEARCH SKILLS ────────────────────────────────────────────────────────────
export async function searchSkillsAction(name?: string, category?: string): Promise<ISkillDto[]> {
    try {
        const params: Record<string, string> = {};
        if (name) params.name = name;
        if (category) params.category = category;

        const response = await http.get('/skills/search', { params });
        return response.data as ISkillDto[];
    } catch {
        return [];
    }
}

// ─── GET SKILL BY ID ──────────────────────────────────────────────────────────
export async function getSkillByIdAction(id: string): Promise<ISkillDto | null> {
    if (!id) return null;
    try {
        const response = await http.get(`/skills/${id}`);
        return response.data as ISkillDto;
    } catch {
        return null;
    }
}

// ─── CREATE SKILL ─────────────────────────────────────────────────────────────
export async function createSkillAction(
    prevState: SkillActionState,
    formData: FormData
): Promise<SkillActionState> {
    const name = (formData.get('name') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || undefined;

    if (!name) {
        return { success: false, message: 'Vui lòng nhập tên kỹ năng' };
    }

    try {
        const response = await http.post('/skills', { name, category });
        revalidatePath('/skill-management');
        return { success: true, message: 'Tạo kỹ năng thành công', data: response.data as ISkillDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Tạo kỹ năng thất bại') };
    }
}

// ─── UPDATE SKILL ─────────────────────────────────────────────────────────────
export async function updateSkillAction(
    prevState: SkillActionState,
    formData: FormData
): Promise<SkillActionState> {
    const skillId = formData.get('skillId') as string;
    const name = (formData.get('name') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || undefined;

    if (!skillId) return { success: false, message: 'Thiếu ID kỹ năng' };
    if (!name) return { success: false, message: 'Tên kỹ năng không được để trống' };

    try {
        const payload: { name: string; category?: string } = { name };
        if (category !== undefined) payload.category = category;

        const response = await http.patch(`/skills/${skillId}`, payload);
        revalidatePath('/skill-management');
        return { success: true, message: 'Cập nhật kỹ năng thành công', data: response.data as ISkillDto };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Cập nhật kỹ năng thất bại') };
    }
}

// ─── DELETE SKILL ─────────────────────────────────────────────────────────────
export async function deleteSkillAction(skillId: string): Promise<SkillActionState> {
    if (!skillId) return { success: false, message: 'Thiếu ID kỹ năng' };

    try {
        await http.delete(`/skills/${skillId}`);
        revalidatePath('/skill-management');
        return { success: true, message: 'Xóa kỹ năng thành công' };
    } catch (err) {
        return { success: false, message: extractMessage(err, 'Xóa kỹ năng thất bại') };
    }
}

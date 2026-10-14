'use server';

import { actionErrorMessage as extractMessage, rethrowReadError } from '@/lib/action-error';
import http from '@/lib/http';
import type { IApplicationNote, IPaginatedApplicationNotes } from '@/types/interfaces/evaluation.interface';
import { revalidatePath } from 'next/cache';

export type NoteActionState = {
    success: boolean;
    message: string;
    data?: IApplicationNote;
};

function noteBodyError(body: string): string | null {
    if (!body) return 'Ghi chú không được để trống';
    if (body.length > 2000) return 'Ghi chú không được vượt quá 2000 ký tự';
    return null;
}

export async function getNotesAction(applicationId: string, page = 1): Promise<IPaginatedApplicationNotes> {
    try {
        const response = await http.get(`/applications/${applicationId}/notes`, { params: { page } });
        return response.data as IPaginatedApplicationNotes;
    } catch (error) {
        rethrowReadError(error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
    }
}

export async function createNoteAction(applicationId: string, body: string): Promise<NoteActionState> {
    if (!applicationId) return { success: false, message: 'Thiếu ID đơn ứng tuyển' };

    const normalizedBody = body.trim();
    const errorMessage = noteBodyError(normalizedBody);
    if (errorMessage) return { success: false, message: errorMessage };

    try {
        const response = await http.post(`/applications/${applicationId}/notes`, { body: normalizedBody });
        revalidatePath('/jobs', 'layout');
        return { success: true, message: 'Đã thêm ghi chú', data: response.data as IApplicationNote };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Thêm ghi chú thất bại') };
    }
}

export async function updateNoteAction(noteId: string, body: string): Promise<NoteActionState> {
    if (!noteId) return { success: false, message: 'Thiếu ID ghi chú' };

    const normalizedBody = body.trim();
    const errorMessage = noteBodyError(normalizedBody);
    if (errorMessage) return { success: false, message: errorMessage };

    try {
        const response = await http.patch(`/application-notes/${noteId}`, { body: normalizedBody });
        revalidatePath('/jobs', 'layout');
        return { success: true, message: 'Đã cập nhật ghi chú', data: response.data as IApplicationNote };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Cập nhật ghi chú thất bại') };
    }
}

export async function deleteNoteAction(noteId: string): Promise<NoteActionState> {
    if (!noteId) return { success: false, message: 'Thiếu ID ghi chú' };

    try {
        await http.delete(`/application-notes/${noteId}`);
        revalidatePath('/jobs', 'layout');
        return { success: true, message: 'Đã xoá ghi chú' };
    } catch (error) {
        return { success: false, message: extractMessage(error, 'Xoá ghi chú thất bại') };
    }
}

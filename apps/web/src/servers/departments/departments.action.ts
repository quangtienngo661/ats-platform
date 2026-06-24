"use server";

import { revalidatePath } from "next/cache";
import http from "@/lib/http";
import { Department as DepartmentDto, DepartmentMember } from "@/types/interfaces/departments.interface";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DepartmentState = {
    success: boolean;
    message: string;
};

// Re-export IDepartmentDto từ @ats-platform/types để các component có thể import trực tiếp từ đây

function extractMessage(error: any, fallback: string): string {
    const msg = error?.response?.data?.message || fallback;
    return Array.isArray(msg) ? msg[0] : msg;
}

// ─── Mapper ─────────────────────────────────────────────────────────────────

function mapSingleRecruiter(recruiter: any): DepartmentMember {
    return {
        recruiterId: recruiter.recruiterId,
        userId: recruiter.userId,
        fullName: recruiter.user.fullName,
        email: recruiter.user.email,
        phoneNumber: recruiter.user.phoneNumber,
        role: recruiter.user.role,
        position: recruiter.position,
        status: recruiter.user.status,
    };
}

function mapRecruiters(recruiters: any[]): DepartmentMember[] {
    if (!Array.isArray(recruiters)) return [];
    return recruiters.map(mapSingleRecruiter);
}

function mapSingleDepartment(department: any): DepartmentDto {
    return {
        departmentId: department.departmentId,
        name: department.name,
        description: department.description || "",
        color: department.color || "#0071E3",
        members: mapRecruiters(department.recruiters),
        jobPostingsCount: department.jobPostings?.length || 0,
        membersCount: department.recruiters?.length || 0,
    };
}

function mapDepartment(departments: any): DepartmentDto[] {
    if (!Array.isArray(departments)) return [];
    return departments.map(mapSingleDepartment);
}

// ─── Actions ─────────────────────────────────────────────────────────────────
export async function createDepartmentAction(
    prevState: DepartmentState,
    formData: FormData
    // ): Promise<DepartmentState> {
) {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;

    if (!name?.trim()) {
        return { success: false, message: "Vui lòng nhập tên phòng ban" };
    }

    try {
        await http.post(`/departments`, { name, description, color });

        revalidatePath("/department-management");
        return { success: true, message: "Tạo phòng ban thành công" };
    } catch (error: any) {
        return { success: false, message: extractMessage(error, "Tạo phòng ban thất bại") };
    }
}

export async function getDepartmentsAction(): Promise<DepartmentDto[]> {
    try {
        const response = await http.get(`/departments`);
        return mapDepartment(response.data);
    } catch (error: any) {
        console.error("[getDepartmentsAction]", extractMessage(error, "Không thể tải danh sách phòng ban"));
        return [];
    }
}

export async function getDepartmentByIdAction(id: string): Promise<DepartmentDto | null> {
    if (!id) return null;
    try {
        const data = await http.get(`/departments/${id}`);
        const raw = (data as any)?.data ?? data;
        return raw ? mapSingleDepartment(raw) : null;
    } catch (error: any) {
        console.error("[getDepartmentByIdAction]", extractMessage(error, "Không thể tải phòng ban"));
        return null;
    }
}
export async function updateDepartmentAction(
    // id: string,
    prevState: DepartmentState,
    formData: FormData
): Promise<DepartmentState> {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const color = formData.get("color") as string;
    const id = formData.get("departmentId") as string;

    if (!id) {
        return { success: false, message: "ID phòng ban không hợp lệ" };
    }

    if (!name?.trim()) {
        return { success: false, message: "Vui lòng nhập tên phòng ban" };
    }

    try {
        await http.patch(`/departments/${id}`, { name, description, color });

        revalidatePath("/department-management");
        return { success: true, message: "Cập nhật phòng ban thành công" };
    } catch (error: any) {
        return { success: false, message: extractMessage(error, "Cập nhật phòng ban thất bại") };
    }
}
export async function deleteDepartmentAction(
    department: DepartmentDto
): Promise<DepartmentState> {
    if (!department.departmentId) {
        return { success: false, message: "ID phòng ban không hợp lệ" };
    }

    if (department.membersCount > 0) {
        return { success: false, message: "Phòng ban có thành viên không thể xoá" };
    }

    if (department.jobPostingsCount > 0) {
        return { success: false, message: "Phòng ban có tin tuyển dụng không thể xoá" };
    }

    try {
        await http.delete(`/departments/${department.departmentId}`);

        revalidatePath("/department-management");
        return { success: true, message: "Xoá phòng ban thành công" };
    } catch (error) {
        return { success: false, message: extractMessage(error, "Xoá phòng ban thất bại") };
    }
}

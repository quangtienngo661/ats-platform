import { toast as sonner, ExternalToast } from 'sonner';

// ─── Base options ────────────────────────────────────────────────────────────
const BASE: ExternalToast = {
    duration: 3500,
    position: 'bottom-right',
};

// ─── Generic helpers ─────────────────────────────────────────────────────────
export const toast = {
    success: (message: string, description?: string, opts?: ExternalToast) =>
        sonner.success(message, { ...BASE, description, ...opts }),

    error: (message: string, description?: string, opts?: ExternalToast) =>
        sonner.error(message, { ...BASE, description, ...opts }),

    warning: (message: string, description?: string, opts?: ExternalToast) =>
        sonner.warning(message, { ...BASE, description, ...opts }),

    info: (message: string, description?: string, opts?: ExternalToast) =>
        sonner.info(message, { ...BASE, description, ...opts }),

    loading: (message: string, opts?: ExternalToast) =>
        sonner.loading(message, { ...BASE, ...opts }),

    dismiss: (id?: string | number) => sonner.dismiss(id),

    promise: <T>(
        promise: Promise<T>,
        msgs: { loading: string; success: string; error: string },
        opts?: ExternalToast
    ) =>
        sonner.promise(promise, {
            loading: msgs.loading,
            success: msgs.success,
            error: msgs.error,
            ...BASE,
            ...opts,
        }),
};

// ─── AI Config toasts ────────────────────────────────────────────────────────
export const aiConfigToast = {
    // CRUD
    createSuccess: (name?: string) =>
        toast.success('Tạo cấu hình thành công', name ? `"${name}" đã được thêm vào danh sách` : undefined),
    createError: () =>
        toast.error('Tạo cấu hình thất bại', 'Vui lòng kiểm tra lại thông tin và thử lại'),

    updateSuccess: (name?: string) =>
        toast.success('Cập nhật thành công', name ? `"${name}" đã được lưu` : undefined),
    updateError: () =>
        toast.error('Cập nhật thất bại', 'Không thể lưu thay đổi, vui lòng thử lại'),

    deleteSuccess: (name?: string) =>
        toast.success('Xóa thành công', name ? `"${name}" đã bị xóa` : undefined),
    deleteError: () =>
        toast.error('Xóa thất bại', 'Không thể xóa cấu hình này, vui lòng thử lại'),

    // Duplicate
    duplicateSuccess: (name?: string) =>
        toast.success('Nhân bản thành công', name ? `Đã tạo bản sao của "${name}"` : undefined),
    duplicateError: () =>
        toast.error('Không thể nhân bản', 'Đã xảy ra lỗi khi nhân bản cấu hình, vui lòng thử lại'),

    // Set default
    setDefaultSuccess: (name?: string) =>
        toast.success('Đặt mặc định thành công', name ? `"${name}" hiện là cấu hình mặc định` : undefined),
    setDefaultError: () =>
        toast.error('Thao tác thất bại', 'Không thể đặt cấu hình này làm mặc định'),

    // Validation
    invalidWeights: () =>
        toast.warning('Tổng trọng số không hợp lệ', 'Tổng 3 trọng số phải đúng bằng 100%'),
};

// ─── Auth toasts ─────────────────────────────────────────────────────────────
export const authToast = {
    loginSuccess: () =>
        toast.success('Đăng nhập thành công', 'Chào mừng bạn trở lại!'),
    loginError: (msg?: string) =>
        toast.error('Đăng nhập thất bại', msg ?? 'Sai tài khoản hoặc mật khẩu'),

    logoutSuccess: () =>
        toast.info('Đã đăng xuất', 'Hẹn gặp lại bạn!'),

    sessionExpired: () =>
        toast.warning('Phiên đã hết hạn', 'Vui lòng đăng nhập lại để tiếp tục'),

    unauthorised: () =>
        toast.error('Không có quyền truy cập', 'Bạn không có quyền thực hiện thao tác này'),
};

// ─── Generic CRUD toasts (dùng cho các module khác) ──────────────────────────
export const crudToast = {
    createSuccess: (entity = 'Mục') =>
        toast.success(`${entity} đã được tạo thành công`),
    createError: (entity = 'Mục') =>
        toast.error(`Không thể tạo ${entity.toLowerCase()}`, 'Vui lòng thử lại'),

    updateSuccess: (entity = 'Mục') =>
        toast.success(`${entity} đã được cập nhật`),
    updateError: (entity = 'Mục') =>
        toast.error(`Không thể cập nhật ${entity.toLowerCase()}`, 'Vui lòng thử lại'),

    deleteSuccess: (entity = 'Mục') =>
        toast.success(`${entity} đã bị xóa`),
    deleteError: (entity = 'Mục') =>
        toast.error(`Không thể xóa ${entity.toLowerCase()}`, 'Vui lòng thử lại'),

    fetchError: () =>
        toast.error('Không thể tải dữ liệu', 'Vui lòng kiểm tra kết nối và thử lại'),

    saveSuccess: () =>
        toast.success('Lưu thành công'),
    saveError: () =>
        toast.error('Lưu thất bại', 'Đã xảy ra lỗi, vui lòng thử lại'),
};

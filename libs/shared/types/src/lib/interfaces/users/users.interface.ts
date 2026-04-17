import { UserRole, UserStatus } from '@ats-platform/database';

/** DTO dùng để tạo / cập nhật người dùng (đầu vào) */
export interface IUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  status?: UserStatus;
  role?: UserRole;
}



import { UserRole, UserStatus } from '@ats-platform/database';

/** DTO dùng để tạo / cập nhật người dùng (đầu vào) */
export interface IUserDto {
  userId?: string;
  email?: string;
  password?: string;
  fullName?: string;
  phoneNumber?: string;
  status?: UserStatus;
  role?: UserRole;
}



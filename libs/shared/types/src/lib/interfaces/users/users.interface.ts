import { UserRole, UserStatus } from '../../../../../../backend/database/src/generated/prisma/enums';

export interface IUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  status?: UserStatus;
  role?: UserRole;
}
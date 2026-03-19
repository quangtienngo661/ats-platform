import { Role, UserStatus } from '../../enums';

export interface IUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
  status?: UserStatus;
  role?: Role;
}
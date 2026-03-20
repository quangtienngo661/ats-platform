import { Role, UserStatus } from '../../enums';

export interface IUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  status?: UserStatus;
  role?: Role;
}
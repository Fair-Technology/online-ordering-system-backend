import { SystemRole } from '../../../domain/user/UserProfile';

export interface GetMeResultDto {
  id: string;
  email?: string;
  name?: string;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
}

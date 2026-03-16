export type SystemRole = 'user' | 'superadmin';

export interface UserProfile {
  id: string; // Entra oid — partition key
  email?: string;
  name?: string;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
}

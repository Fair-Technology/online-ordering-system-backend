export type SystemRole = 'user' | 'superadmin';

export interface UserProfile {
  id: string; // Entra oid — partition key
  email?: string;
  name?: string;
  systemRole: SystemRole;
  maxShops?: number | null; // per-user override; null = use global default; -1 = unlimited
  createdAt: string;
  updatedAt: string;
}

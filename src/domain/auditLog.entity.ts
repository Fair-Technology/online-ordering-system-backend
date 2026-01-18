import { DocumentBase } from './baseTypes';

export type PrincipalType = 'user' | 'role' | 'service' | 'apiKey';

export interface PrincipalRef {
  type: PrincipalType;
  id: string;
  scope?: string; // e.g. shopId for role principals
}

export interface AccessControlEntry extends DocumentBase {
  resourceType: string;
  resourceId: string;
  principal: PrincipalRef;
  permissions: string[];
  effect: 'allow' | 'deny';
  expiresAt?: string;
}

export interface AuditLog extends DocumentBase {
  actor: PrincipalRef;
  shopId?: string;
  entityType: string;
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}

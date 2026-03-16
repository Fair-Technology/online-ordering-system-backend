export interface AuditChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface AuditEntry {
  id: string;
  shopId: string;
  timestamp: string;

  actorId: string;
  actorEmail?: string;
  actorName?: string;

  action: string;
  entityType: string;
  entityId: string;
  entityName: string;

  changes?: AuditChange[];
  ipAddress?: string;
  userAgent?: string;

  ttl: number;
}

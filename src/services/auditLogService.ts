import { AuditLog, PrincipalRef } from '../domain/auditLog.entity';
import { createAuditLogRepository } from '../repositories/auditLogRepository';
import { newId, nowIso } from '../utils/general';

export interface AuditLogInput {
  actorUserId?: string;
  actor?: PrincipalRef;
  shopId?: string;
  entityType: AuditLog['entityType'];
  entityId: string;
  action: string;
  before?: unknown;
  after?: unknown;
}

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  const timestamp = nowIso();
  const actor: PrincipalRef =
    entry.actor ??
    ({
      type: 'user',
      id: entry.actorUserId ?? 'system',
    } as PrincipalRef);

  const payload: AuditLog = {
    id: newId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    actor,
    shopId: entry.shopId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
    before: entry.before,
    after: entry.after,
  };

  await createAuditLogRepository(payload);
}

import { getContainer } from '../infrastructure/cosmosClient';
import { AuditLog } from '../domain/auditLog.entity';

const auditLogContainer = getContainer('auditLogs');

export async function createAuditLogRepository(
  log: AuditLog,
): Promise<void> {
  await auditLogContainer.items.create(log);
}

import { AuditEntry } from '../../../domain/audit/AuditEntry';
import { auditLogsContainer } from '../cosmosClient';

export async function createAuditEntry(entry: AuditEntry): Promise<void> {
  await auditLogsContainer.items.create<AuditEntry>(entry);
}

export async function findAuditEntriesByShop(
  shopId: string,
  page: number,
  pageSize: number,
): Promise<{ entries: AuditEntry[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const countSpec = {
    query: 'SELECT VALUE COUNT(1) FROM c WHERE c.shopId = @shopId',
    parameters: [{ name: '@shopId', value: shopId }],
  };
  const { resources: countResult } = await auditLogsContainer.items
    .query<number>(countSpec)
    .fetchAll();
  const total = countResult[0] ?? 0;

  const querySpec = {
    query:
      'SELECT * FROM c WHERE c.shopId = @shopId ORDER BY c.timestamp DESC OFFSET @offset LIMIT @pageSize',
    parameters: [
      { name: '@shopId', value: shopId },
      { name: '@offset', value: offset },
      { name: '@pageSize', value: pageSize },
    ],
  };
  const { resources: entries } = await auditLogsContainer.items
    .query<AuditEntry>(querySpec)
    .fetchAll();

  return { entries: entries ?? [], total };
}

const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import { AuditLog } from '../types/databaseTypes';
import { getContainer } from '../config/cosmosClient';
import { getActorUserId, newId, nowIso } from '../utils/general';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const auditLogsContainer = getContainer('auditLogs');

async function readBody<T>(request: HttpRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function missingField(field: string): HttpResponseInit {
  return json(400, { message: `${field} is required` });
}

// GET /auditLogs -> list audit logs with optional filters
app.http('auditLogsList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auditLogs',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.query.get('shopId')?.trim();
      const entityType = request.query.get('entityType')?.trim();
      const entityId = request.query.get('entityId')?.trim();

      const filters: string[] = [];
      const parameters: any[] = [];

      if (shopId) {
        filters.push('c.shopId = @shopId');
        parameters.push({ name: '@shopId', value: shopId });
      }
      if (entityType) {
        filters.push('c.entityType = @entityType');
        parameters.push({ name: '@entityType', value: entityType });
      }
      if (entityId) {
        filters.push('c.entityId = @entityId');
        parameters.push({ name: '@entityId', value: entityId });
      }

      let query = 'SELECT * FROM c';
      if (filters.length > 0) {
        query += ` WHERE ${filters.join(' AND ')}`;
      }
      query += ' ORDER BY c.timestamp DESC';

      const { resources } = await auditLogsContainer.items
        .query<AuditLog>({ query, parameters })
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// GET /auditLogs/{logId} -> fetch a single audit log entry
app.http('auditLogsGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auditLogs/{logId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const logId = request.params?.logId?.trim();
      if (!logId) {
        return missingField('logId');
      }

      const { resource } = await auditLogsContainer
        .item(logId, logId)
        .read<AuditLog>();
      if (!resource) {
        return json(404, { message: 'Audit log not found' });
      }
      return json(200, resource);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// POST /auditLogs -> create an audit log entry manually
app.http('auditLogsCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auditLogs',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const payload = await readBody<Partial<AuditLog>>(request);
      if (!payload.entityType) {
        return missingField('entityType');
      }
      if (!payload.entityId) {
        return missingField('entityId');
      }
      if (!payload.action) {
        return missingField('action');
      }

      const log: AuditLog = {
        id: newId(),
        actorUserId: payload.actorUserId ?? getActorUserId(request),
        shopId: payload.shopId,
        entityType: payload.entityType,
        entityId: payload.entityId,
        action: payload.action,
        before: payload.before,
        after: payload.after,
        timestamp: payload.timestamp ?? nowIso(),
      };

      await auditLogsContainer.items.create(log);
      return json(201, log);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// PATCH /auditLogs/{logId} -> update an audit log entry
app.http('auditLogsUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'auditLogs/{logId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const logId = request.params?.logId?.trim();
      if (!logId) {
        return missingField('logId');
      }
      const { resource } = await auditLogsContainer
        .item(logId, logId)
        .read<AuditLog>();
      if (!resource) {
        return json(404, { message: 'Audit log not found' });
      }

      const updates = await readBody<Partial<AuditLog>>(request);
      const updated: AuditLog = {
        ...resource,
        ...updates,
        id: resource.id,
        timestamp: updates.timestamp ?? nowIso(),
      };

      await auditLogsContainer.items.upsert(updated);
      return json(200, updated);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// DELETE /auditLogs/{logId} -> remove an audit log entry
app.http('auditLogsDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'auditLogs/{logId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const logId = request.params?.logId?.trim();
      if (!logId) {
        return missingField('logId');
      }

      const { resource } = await auditLogsContainer
        .item(logId, logId)
        .read<AuditLog>();
      if (!resource) {
        return json(404, { message: 'Audit log not found' });
      }

      await auditLogsContainer.item(logId, logId).delete();
      return { status: 204 };
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

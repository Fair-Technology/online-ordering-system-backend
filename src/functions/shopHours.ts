const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../types/otherTypes';
import { ShopHours } from '../types/databaseTypes';
import { getContainer } from '../config/cosmosClient';
import { newId, nowIso } from '../utils/general';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const shopHoursContainer = getContainer('shopHours');

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

function normalizeWeekly(input: any): ShopHours['weekly'] {
  if (!input || typeof input !== 'object') {
    return {};
  }
  return input;
}

// GET /shopHours -> list shopHours documents (optionally filter by shopId)
app.http('shopHoursListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shopHours',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.query.get('shopId')?.trim();
      let query = 'SELECT * FROM c';
      const parameters: any[] = [];
      if (shopId) {
        query += ' WHERE c.shopId = @shopId';
        parameters.push({ name: '@shopId', value: shopId });
      }
      query += ' ORDER BY c.updatedAt DESC';

      const { resources } = await shopHoursContainer.items
        .query<ShopHours>({ query, parameters })
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// GET /shopHours/{recordId} -> fetch a shopHours record by id
app.http('shopHoursGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shopHours/{recordId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const recordId = request.params?.recordId?.trim();
      if (!recordId) {
        return missingField('recordId');
      }

      const { resource } = await shopHoursContainer
        .item(recordId, recordId)
        .read<ShopHours>();
      if (!resource) {
        return json(404, { message: 'Shop hours not found' });
      }
      return json(200, resource);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// POST /shopHours -> create a shopHours record
app.http('shopHoursCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shopHours',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = await readBody<Partial<ShopHours>>(request);
      const shopId = body.shopId?.trim();
      if (!shopId) {
        return missingField('shopId');
      }
      if (!body.timezone) {
        return missingField('timezone');
      }

      const recordId = body.id?.trim() ?? shopId ?? newId();
      const timestamp = nowIso();
      const record: ShopHours = {
        id: recordId,
        shopId,
        timezone: body.timezone,
        weekly: normalizeWeekly(body.weekly),
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await shopHoursContainer.items.create(record);
      return json(201, record);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// PATCH /shopHours/{recordId} -> update a shopHours record
app.http('shopHoursUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shopHours/{recordId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const recordId = request.params?.recordId?.trim();
      if (!recordId) {
        return missingField('recordId');
      }

      const { resource } = await shopHoursContainer
        .item(recordId, recordId)
        .read<ShopHours>();
      if (!resource) {
        return json(404, { message: 'Shop hours not found' });
      }

      const updates = await readBody<Partial<ShopHours>>(request);
      const updated: ShopHours = {
        ...resource,
        ...updates,
        weekly:
          updates.weekly !== undefined
            ? normalizeWeekly(updates.weekly)
            : resource.weekly,
        updatedAt: nowIso(),
      };

      await shopHoursContainer.items.upsert(updated);
      return json(200, updated);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// DELETE /shopHours/{recordId} -> delete a shopHours record
app.http('shopHoursDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'shopHours/{recordId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const recordId = request.params?.recordId?.trim();
      if (!recordId) {
        return missingField('recordId');
      }

      const { resource } = await shopHoursContainer
        .item(recordId, recordId)
        .read<ShopHours>();
      if (!resource) {
        return json(404, { message: 'Shop hours not found' });
      }

      await shopHoursContainer.item(recordId, recordId).delete();
      return { status: 204 };
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

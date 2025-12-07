const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../domain/otherTypes';
import { ShopMember } from '../domain/databaseTypes';
import { getContainer } from '../infrastructure/cosmosClient';
import { newId, nowIso } from '../utils/general';

type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

const shopMembersContainer = getContainer('shopMembers');

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

function normalizePermissions(input: any): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((value) => typeof value === 'string');
}

// GET /shopMembers -> list shop members (optional shopId filter)
app.http('shopMembersListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shopMembers',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.query.get('shopId')?.trim();
      let query = 'SELECT * FROM c';
      const parameters: any[] = [];
      if (shopId) {
        query += ' WHERE c.shopId = @shopId';
        parameters.push({ name: '@shopId', value: shopId });
      }
      query += ' ORDER BY c.createdAt DESC';

      const { resources } = await shopMembersContainer.items
        .query<ShopMember>({ query, parameters })
        .fetchAll();
      return json(200, resources);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// GET /shopMembers/{memberId} -> fetch a member record
app.http('shopMembersGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shopMembers/{memberId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const memberId = request.params?.memberId?.trim();
      if (!memberId) {
        return missingField('memberId');
      }

      const { resource } = await shopMembersContainer
        .item(memberId, memberId)
        .read<ShopMember>();
      if (!resource) {
        return json(404, { message: 'Shop member not found' });
      }

      return json(200, resource);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// POST /shopMembers -> create a member record
app.http('shopMembersCreateGeneral', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shopMembers',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = await readBody<Partial<ShopMember>>(request);
      if (!body.shopId) {
        return missingField('shopId');
      }
      if (!body.userId) {
        return missingField('userId');
      }

      const timestamp = nowIso();
      const member: ShopMember = {
        id: newId(),
        shopId: body.shopId.trim(),
        userId: body.userId.trim(),
        role: body.role ?? 'staff',
        isActive: body.isActive ?? true,
        invitationStatus: body.invitationStatus ?? 'accepted',
        invitedByUserId: body.invitedByUserId,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await shopMembersContainer.items.create(member);
      return json(201, member);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// PATCH /shopMembers/{memberId} -> update a member record
app.http('shopMembersUpdateGeneral', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shopMembers/{memberId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const memberId = request.params?.memberId?.trim();
      if (!memberId) {
        return missingField('memberId');
      }

      const { resource } = await shopMembersContainer
        .item(memberId, memberId)
        .read<ShopMember>();
      if (!resource) {
        return json(404, { message: 'Shop member not found' });
      }

      const updates = await readBody<Partial<ShopMember>>(request);
      const updated: ShopMember = {
        ...resource,
        ...updates,
        updatedAt: nowIso(),
      };

      await shopMembersContainer.items.upsert(updated);
      return json(200, updated);
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

// DELETE /shopMembers/{memberId} -> remove a member record
app.http('shopMembersDeleteGeneral', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'shopMembers/{memberId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const memberId = request.params?.memberId?.trim();
      if (!memberId) {
        return missingField('memberId');
      }

      const { resource } = await shopMembersContainer
        .item(memberId, memberId)
        .read<ShopMember>();
      if (!resource) {
        return json(404, { message: 'Shop member not found' });
      }

      await shopMembersContainer.item(memberId, memberId).delete();
      return { status: 204 };
    } catch (error: any) {
      const status = error?.status ?? 500;
      return { status, body: error?.message ?? 'Internal Server Error' };
    }
  },
});

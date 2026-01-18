const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../domain/otherTypes';
import { mapShopToDTO } from '../domain/shop.dto';
import { ShopMemberRole, ShopMember } from '../domain/shop.entity';
import {
  createShopService,
  deleteShopService,
  getShopByIdService,
  getShopMenuByIdService,
  getShopWithMenuBySlug,
  listManagedShopsService,
  listShopsService,
  ShopInput,
  updateShopService,
} from '../services/shopService';
import {
  createShopMemberService,
  listShopMembersService,
  updateShopMemberService,
} from '../services/shopMemberService';
import { readBody } from '../utils/general';
import { requireAuth } from '../utils/authMiddleware';

type HttpRequest = HttpRequestLike;
type HttpResponse = HttpResponseInitLike;

function parseShopBody(body: any): ShopInput {
  return {
    name: typeof body?.name === 'string' ? body.name : '',
    slug: typeof body?.slug === 'string' ? body.slug : '',
    ownerUserId: typeof body?.ownerUserId === 'string' ? body.ownerUserId : '',
    legalName: typeof body?.legalName === 'string' ? body.legalName : undefined,
    address: typeof body?.address === 'string' ? body.address : undefined,
    timezone: typeof body?.timezone === 'string' ? body.timezone : undefined,
    status: body?.status,
    acceptingOrders:
      typeof body?.acceptingOrders === 'boolean'
        ? body.acceptingOrders
        : undefined,
    paymentPolicy: body?.paymentPolicy,
    orderAcceptanceMode: body?.orderAcceptanceMode,
    allowGuestCheckout:
      typeof body?.allowGuestCheckout === 'boolean'
        ? body.allowGuestCheckout
        : undefined,
    fulfillmentOptions: body?.fulfillmentOptions,
    defaultCurrency:
      typeof body?.defaultCurrency === 'string'
        ? body.defaultCurrency
        : undefined,
  };
}

app.http('shopsListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const shops = await listShopsService();
        return json(
          200,
          shops.map((shop) => mapShopToDTO(shop)),
        );
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopsCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const body = await readBody(request);
        const shop = await createShopService(parseShopBody(body));
        return json(201, mapShopToDTO(shop));
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopsGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const shopId = request.params?.shopId?.trim();
        if (!shopId) {
          return json(400, { message: 'shopId is required' });
        }
        const shop = await getShopByIdService(shopId);
        return json(200, mapShopToDTO(shop));
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopsUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const shopId = request.params?.shopId?.trim();
        if (!shopId) {
          return json(400, { message: 'shopId is required' });
        }
        const body = await readBody(request);
        const shop = await updateShopService(shopId, parseShopBody(body));
        return json(200, mapShopToDTO(shop));
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopsDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const shopId = request.params?.shopId?.trim();
        if (!shopId) {
          return json(400, { message: 'shopId is required' });
        }
        await deleteShopService(shopId);
        return { status: 204 };
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopMembersList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const shopId = request.params?.shopId?.trim();
        if (!shopId) {
          return json(400, { message: 'shopId is required' });
        }
        const members = await listShopMembersService(shopId);
        return json(200, members);
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopMembersCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const shopId = request.params?.shopId?.trim();
        if (!shopId) {
          return json(400, { message: 'shopId is required' });
        }
        const body = await readBody<{ userId?: string; role?: ShopMemberRole }>(
          request,
        );
        if (!body?.userId?.trim()) {
          return json(400, { message: 'userId is required' });
        }
        if (!body.role) {
          return json(400, { message: 'role is required' });
        }
        const member = await createShopMemberService(shopId, {
          userId: body.userId.trim(),
          role: body.role,
        });
        return json(201, member);
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopMembersUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/members/{memberId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const memberId = request.params?.memberId?.trim();
        if (!memberId) {
          return json(400, { message: 'memberId is required' });
        }
        const body = await readBody<Partial<ShopMember>>(request);
        const member = await updateShopMemberService(memberId, {
          role: body?.role,
          isActive: body?.isActive,
        });
        return json(200, member);
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('usersGetShops', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{userId}/shops',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const userId = request.params?.userId?.trim();
        if (!userId) {
          return json(400, { message: 'userId is required' });
        }
        const shops = await listManagedShopsService(userId);
        return json(200, shops);
      } catch (error: any) {
        return {
          status: error.status || 500,
          body: error.message || 'Internal Server Error',
        };
      }
    });
  },
});

app.http('shopsMenu', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/menu',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const shopId = request.params?.shopId?.trim();
      if (!shopId) {
        return json(400, { message: 'shopId is required' });
      }
      const { menu } = await getShopMenuByIdService(shopId);
      return json(200, menu);
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('getShopBySlug', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/slug/{slug}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const slug = request.params?.slug?.trim();
      if (!slug) {
        return json(400, { message: 'slug is required' });
      }
      const { shop } = await getShopWithMenuBySlug(slug);
      return json(200, mapShopToDTO(shop));
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

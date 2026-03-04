import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeCreateShopRole } from '../../../application/shop/createShopRole/executeCreateShopRole';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('createShopRole', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/roles',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const body = (await request.json()) as any;

      const result = await executeCreateShopRole(
        { shopId, name: body.name, permissions: body.permissions },
        request,
      );

      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

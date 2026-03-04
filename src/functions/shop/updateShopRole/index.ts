import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeUpdateShopRole } from '../../../application/shop/updateShopRole/executeUpdateShopRole';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('updateShopRole', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/roles/{roleId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const roleId = request.params.roleId;
      const body = (await request.json()) as any;

      const result = await executeUpdateShopRole(
        { shopId, roleId, name: body.name, permissions: body.permissions },
        request,
      );

      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

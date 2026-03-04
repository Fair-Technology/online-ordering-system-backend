import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeDeleteShopRole } from '../../../application/shop/deleteShopRole/executeDeleteShopRole';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('deleteShopRole', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/roles/{roleId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const roleId = request.params.roleId;

      const result = await executeDeleteShopRole({ shopId, roleId }, request);

      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

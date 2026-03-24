import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeReactivateShop } from '../../../application/shop/reactivateShop/executeReactivateShop';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('reactivateShop', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/reactivate',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const result = await executeReactivateShop(shopId, request);
      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

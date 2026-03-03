import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeGetOrdersByShop } from '../../../application/order/getOrdersByShop/executeGetOrdersByShop';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('getOrdersByShop', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/orders',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const result = await executeGetOrdersByShop({ shopId }, request);
      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

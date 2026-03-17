import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeGetShopSubscription } from '../../../application/subscription/getShopSubscription/executeGetShopSubscription';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('getShopSubscription', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/subscription',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const result = await executeGetShopSubscription(shopId, request);
      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

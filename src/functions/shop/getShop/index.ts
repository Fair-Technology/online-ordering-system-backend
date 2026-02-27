import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeGetShop } from '../../../application/shop/getShop/executeGetShop';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('getShop', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      
      const result = await executeGetShop({ shopId }, request);
      
      return mapResultToHttp(result);
    } catch (error) {
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' }
      };
    }
  }
});

import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeDeleteShop } from '../../../application/shop/deleteShop/executeDeleteShop';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('deleteShop', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      
      const result = await executeDeleteShop({ shopId });
      
      return mapResultToHttp(result);
    } catch (error) {
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' }
      };
    }
  }
});

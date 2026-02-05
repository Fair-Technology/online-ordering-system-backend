import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeUpdateShop } from '../../../application/shop/updateShop/executeUpdateShop';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('updateShop', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const body = await request.json() as any;
      
      const result = await executeUpdateShop({ shopId, ...body });
      
      return mapResultToHttp(result);
    } catch (error) {
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' }
      };
    }
  }
});

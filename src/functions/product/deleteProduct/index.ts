import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeDeleteProduct } from '../../../application/product/deleteProduct/executeDeleteProduct';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('deleteProduct', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'products/{productId}',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const productId = request.params.productId;
      const shopId = request.query.get('shopId');
      
      if (!shopId) {
        return {
          status: 400,
          jsonBody: { error: 'shopId query parameter is required' }
        };
      }
      
      const result = await executeDeleteProduct({ productId, shopId });
      
      return mapResultToHttp(result);
    } catch (error) {
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' }
      };
    }
  }
});

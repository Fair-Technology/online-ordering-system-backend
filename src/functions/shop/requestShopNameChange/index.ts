import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeRequestShopNameChange } from '../../../application/shop/requestShopNameChange/executeRequestShopNameChange';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('requestShopNameChange', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/name-change-request',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const body = (await request.json()) as { requestedName?: string };

      const result = await executeRequestShopNameChange(
        { shopId, requestedName: body.requestedName ?? '' },
        request,
      );

      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

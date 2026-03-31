import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeGetGoLiveStatus } from '../../../application/shop/getGoLiveStatus/executeGetGoLiveStatus';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('getGoLiveStatus', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shops/{shopId}/go-live-status',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const shopId = request.params.shopId;
      const result = await executeGetGoLiveStatus({ shopId }, request);
      return mapResultToHttp(result);
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

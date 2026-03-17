import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { executeGetPlan } from '../../../application/plan/getPlan/executeGetPlan';
import { mapResultToHttp } from '../../_shared/mapResultToHttp';

app.http('getPlanPricing', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'plans/{planId}/pricing',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const planId = request.params.planId;
      const result = await executeGetPlan(planId, request);
      if (!result.ok) return mapResultToHttp(result);
      return { status: 200, jsonBody: result.data.pricing };
    } catch (error) {
      return { status: 500, jsonBody: { error: 'Internal server error' } };
    }
  },
});

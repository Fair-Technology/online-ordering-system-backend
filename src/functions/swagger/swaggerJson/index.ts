import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import { swaggerSpec } from '../../../swagger/swaggerSpec';

app.http('swaggerJson', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'swagger.json',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      jsonBody: swaggerSpec
    };
  }
});

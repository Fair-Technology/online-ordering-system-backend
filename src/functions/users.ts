const { app } = require('@azure/functions');

import {
  HttpRequestLike,
  HttpResponseInitLike,
  json,
} from '../domain/otherTypes';
import { mapUserToDTO } from '../domain/user.dto';
import {
  createUserService,
  deleteUserService,
  getUserByIdService,
  listUsersService,
  updateUserService,
} from '../services/userService';
import { validateAccessToken } from '../utils/auth';

type HttpRequest = HttpRequestLike;
type HttpResponse = HttpResponseInitLike;

function readJsonBody<T>(request: HttpRequest): Promise<T | null> {
  return request
    .json()
    .then((body) => body as T)
    .catch(() => null);
}

app.http('usersListAll', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const authResult = await validateAccessToken(
        request.headers.get('authorization'),
      );
      if (!authResult.valid) {
        return json(401, { message: authResult.error ?? 'Unauthorized' });
      }
      const users = await listUsersService();
      return json(
        200,
        users.map((user) => mapUserToDTO(user)),
      );
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('userCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const body = await readJsonBody<{ id?: string }>(request);
      const user = await createUserService(body?.id);
      return json(201, mapUserToDTO(user));
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('usersGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const userId = request.params?.userId?.trim();
      if (!userId) {
        return json(400, { message: 'userId is required' });
      }
      const user = await getUserByIdService(userId);
      return json(200, mapUserToDTO(user));
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('usersUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const userId = request.params?.userId?.trim();
      if (!userId) {
        return json(400, { message: 'userId is required' });
      }
      const user = await updateUserService(userId);
      return json(200, mapUserToDTO(user));
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

app.http('usersDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    try {
      const userId = request.params?.userId?.trim();
      if (!userId) {
        return json(400, { message: 'userId is required' });
      }
      await deleteUserService(userId);
      return { status: 204 };
    } catch (error: any) {
      return {
        status: error.status || 500,
        body: error.message || 'Internal Server Error',
      };
    }
  },
});

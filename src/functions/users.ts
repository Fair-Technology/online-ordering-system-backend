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
import { newId, readBody } from '../utils/general';
import { requireAuth } from '../utils/authMiddleware'; // NEW: Import middleware
import { getContainer } from '../infrastructure/cosmosClient';
import { User } from '../domain/user.entity';

const usersContainer = getContainer('users');

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
    return requireAuth(request, async () => {
      try {
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
    });
  },
});

// POST /users -> create a simple user record (NOW PROTECTED)
app.http('userCreate', {
  methods: ['POST'],
  authLevel: 'anonymous', // Still anonymous at Azure level, our middleware handles it
  route: 'users',
  handler: async (request: HttpRequest): Promise<HttpResponse> => {
    return requireAuth(request, async () => {
      try {
        const body = await request.json();
        const response = await createUserService(body.id);
        return json(201, response);
      } catch (err: any) {
        const status = err.status || 500;
        return { status, body: err.message || 'Internal Server Error' };
      }
    });
  },
});

// GET /users/{userId} -> fetch a single user by id (NOW PROTECTED)
app.http('usersGetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (req: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return requireAuth(req, async () => {
      const userId = (req.params?.userId ?? '').trim();
      await getUserByIdService(userId);

      try {
        const { resource } = await usersContainer.item(userId, userId).read();
        if (!resource) {
          return json(404, { message: 'User not found' });
        }
        return json(200, resource);
      } catch (err: any) {
        const status = err.status || 500;
        return { status, body: err.message || 'Internal Server Error' };
      }
    });
  },
});

// PATCH /users/{userId} -> update a user (NOW PROTECTED)
// To Do: Needs to be updated as we don't store currently user details as name or email 
app.http('usersUpdate', {
  methods: ['PATCH'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (req: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return requireAuth(req, async () => {
      return { status: 500, body: 'Not Update available' };
    });
  },
});

// DELETE /users/{userId} -> delete a user (NOW PROTECTED)
app.http('usersDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  
  handler: async (req: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return requireAuth(req, async () => {
      const userId = (req.params?.userId ?? '').trim();
      await deleteUserService(userId);

      try {
        const userId = (req.params?.userId ?? '').trim();
        const { resource } = await usersContainer
          .item(userId, userId)
          .read<User>();
        if (!resource) {
          return json(404, { message: 'User not found' });
        }

        await usersContainer.item(userId, userId).delete();
        return { status: 204 };
      } catch (err: any) {
        const status = err.status || 500;
        return { status, body: err.message || 'Internal Server Error' };
      }
    });
  },
});

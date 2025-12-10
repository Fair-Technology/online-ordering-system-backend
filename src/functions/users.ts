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
import { newId } from '../utils/general';
import { requireAuth } from '../utils/authMiddleware'; // NEW: Import middleware
import { validateUserCreate, validateUsersGetById } from '../utils/businessLogic';
import { getContainer } from '../infrastructure/cosmosClient';
import { User } from '../domain/databaseTypes';

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

// app.http('userCreate', {
//   methods: ['POST'],
//   authLevel: 'anonymous',
//   route: 'users',
//   handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
//     return requireAuth(request, async () => {
//       try {
//         const { resources } = await usersContainer.items
//           .query<User>({ query: 'SELECT * FROM c ORDER BY c.createdAt DESC' })
//           .fetchAll();

//         return json(200, resources);
//       } catch (err: any) {
//         console.error('Error in usersListAll:', err);
//         return { status: 500, body: 'Internal Server Error' };
//       }
//     });
//   },
// })


// POST /users -> create a simple user record (NOW PROTECTED)
app.http('userCreate', {
  methods: ['POST'],
  authLevel: 'anonymous', // Still anonymous at Azure level, our middleware handles it
  route: 'users',
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return requireAuth(request, async () => {
      const body = await validateUserCreate(request);

      try {
        const user: User = {
          id: body.id ?? newId(),
        };
        const { resource } = await usersContainer.items.create(user);
        return json(201, resource);
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
      await validateUsersGetById(req);

      try {
        const userId = (req.params?.userId ?? '').trim();
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
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return requireAuth(request, async () => {
      await validateUsersGetById(request);

      try {
        const userId = (request.params?.userId ?? '').trim();
        const { resource } = await usersContainer
          .item(userId, userId)
          .read<User>();
        if (!resource) {
          return json(404, { message: 'User not found' });
        }

        // const updates = await readBody<Partial<User>>(request);
        // if (updates.id && updates.id !== resource.id) {
        //   return json(400, { message: 'Cannot change user id' });
        // }

        return json(200, resource);
      } catch (err: any) {
        const status = err.status || 500;
        return { status, body: err.message || 'Internal Server Error' };
      }
    });
  },
});

// DELETE /users/{userId} -> delete a user (NOW PROTECTED)
app.http('usersDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  
  handler: async (request: HttpRequestLike): Promise<HttpResponseInitLike> => {
    return requireAuth(request, async () => {
      await validateUsersGetById(request);

      try {
        const userId = (request.params?.userId ?? '').trim();
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

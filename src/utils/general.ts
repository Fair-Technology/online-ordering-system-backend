import { randomUUID } from 'crypto';
import { HttpRequestLike } from '../domain/otherTypes';

type HttpRequest = HttpRequestLike;

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export const getActorUserId = (request: HttpRequest): string => {
  return request.headers.get('x-user-id') ?? 'system';
};

export async function readBody<T>(request: HttpRequest): Promise<T | null> {
  return request
    .json()
    .then((value) => value as T)
    .catch(() => null);
}

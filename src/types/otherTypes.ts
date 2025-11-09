export interface HttpRequestLike {
  json(): Promise<any>;
  query: HttpQueryLike;
  params: Record<string, string>;
  headers: HttpHeadersLike;
}

export interface HttpResponseInitLike {
  status?: number;
  jsonBody?: unknown;
  body?: string;
  headers?: Record<string, string>;
}
type HttpRequest = HttpRequestLike;
type HttpResponseInit = HttpResponseInitLike;

export interface HttpHeadersLike {
  get(name: string): string | null | undefined;
}

export interface HttpQueryLike {
  get(name: string): string | null | undefined;
}

export function json(status: number, body: unknown): HttpResponseInit {
  return { status, jsonBody: body };
}

export type Ctx = { userId?: string; body?: any };
export type GuardResult =
  | { next: true; ctx: Ctx }
  | { next: false; response: HttpResponseInit };

export type Guard = (req: HttpRequest, ctx: Ctx) => Promise<GuardResult>;

// Helper to run guards
export async function runGuards(
  req: HttpRequest,
  guards: Guard[],
  seed: Ctx = {}
): Promise<GuardResult> {
  let ctx = seed;
  for (const g of guards) {
    const res = await g(req, ctx);
    if (!res.next) return res;
    ctx = res.ctx;
  }
  return { next: true, ctx };
}
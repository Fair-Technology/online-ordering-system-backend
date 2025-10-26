export interface HttpHeadersLike {
  get(name: string): string | null | undefined;
}

export interface HttpQueryLike {
  get(name: string): string | null | undefined;
}

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

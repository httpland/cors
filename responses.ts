import {
  isUndefined,
  mergeHeaders,
  Nullable,
  RequiredBy,
  Status,
  STATUS_TEXT,
} from "./deps.ts";
import {
  hasAccessControlAllowOrigin,
  validateCorsRequest,
  validatePreflightRequest,
} from "./utils.ts";

interface SharedOptions {
  /** Configures the `Access-Control-Allow-Origin` header.
   *
   * @default `Origin` field value
   */
  readonly allowOrigin?: string;

  /** Configures the `Access-Control-Allow-Credentials` header. */
  readonly allowCredentials?:
    | string
    | true;
}

export interface CorsOptions extends SharedOptions {
  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?: string;
}

export interface PreflightOptions extends SharedOptions {
  readonly allowOrigin?: string;

  /** Configures the `Access-Control-Allow-Methods` header.
   *
   * @default `Access-Control-Request-Methods` field value
   */
  readonly allowMethods?: string;

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  readonly allowHeaders?: string;

  /** Configures the `Access-Control-Max-Age` header. */
  readonly maxAge?:
    | string
    | number;
}

export function preflightResponse(
  req: Request,
  { allowCredentials, allowOrigin, allowHeaders, allowMethods, maxAge }:
    PreflightOptions,
): Response | undefined {
  const [valid, context] = validatePreflightRequest(req);

  if (!valid) return;

  const { origin, accessControlRequestHeaders, accessControlRequestMethod } =
    context.headers;
  const headersInit = resolvePreflightResponseHeaders({
    allowOrigin: allowOrigin ?? origin,
    allowHeaders: allowHeaders ?? accessControlRequestHeaders,
    allowMethods: allowMethods ?? accessControlRequestMethod,
    maxAge,
    allowCredentials,
  });
  const status = Status.NoContent;

  return new Response(null, {
    headers: headersInit,
    status,
    statusText: STATUS_TEXT[status],
  });
}

export function corsResponse(
  req: Request,
  res: Response,
  { allowOrigin, allowCredentials, exposeHeaders }: CorsOptions,
): Response {
  const [valid, requestInit] = validateCorsRequest(req);

  if (!valid || hasAccessControlAllowOrigin(res.headers)) return res;

  const headerInit = resolveCorsResponseHeaders({
    allowOrigin: allowOrigin ?? requestInit.headers.origin,
    allowCredentials,
    exposeHeaders,
  });
  const headers = mergeHeaders(new Headers(headerInit), res.headers);

  return new Response(res.body, {
    ...res,
    headers,
  });
}

function resolveCorsResponseHeaders(
  { allowOrigin, allowCredentials, exposeHeaders }: CorsResponseHeaders,
): HeadersInit {
  return {
    "access-control-allow-origin": allowOrigin,
    "vary": "origin",
    ...resolveAllowCredentials(allowCredentials),
    ...resolveExposeHeaders(exposeHeaders),
  };
}

type PreflightResponseHeaders = RequiredBy<
  PreflightOptions,
  "allowOrigin" | "allowMethods" | "allowHeaders"
>;

type CorsResponseHeaders = RequiredBy<
  CorsOptions,
  "allowOrigin"
>;

function resolvePreflightResponseHeaders(
  { allowOrigin, allowHeaders, allowMethods, allowCredentials, maxAge }:
    PreflightResponseHeaders,
) {
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": allowHeaders,
    "access-control-allow-methods": allowMethods,
    "vary":
      "origin, access-control-request-headers, access-control-request-method",
    ...resolveAllowCredentials(allowCredentials),
    ...resolveMaxAge(maxAge),
  };
}

function resolveAllowCredentials(
  allowCredentials: string | true | undefined,
): Nullable<
  { "access-control-allow-credentials": string }
> {
  if (isUndefined(allowCredentials)) return;

  return {
    "access-control-allow-credentials": String(allowCredentials),
  };
}

function resolveMaxAge(
  maxAge: string | number | undefined,
): Nullable<{ "access-control-max-age": string }> {
  if (isUndefined(maxAge)) return;

  return {
    "access-control-max-age": String(maxAge),
  };
}

function resolveExposeHeaders(
  exposeHeaders: string | undefined,
): Nullable<{ "access-control-expose-headers": string }> {
  if (isUndefined(exposeHeaders)) return;

  return {
    "access-control-expose-headers": exposeHeaders,
  };
}

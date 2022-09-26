import {
  isUndefined,
  mergeHeaders,
  Nullable,
  RequiredBy,
  Status,
  STATUS_TEXT,
} from "./deps.ts";
import { validateCorsRequest, validatePreflightRequest } from "./utils.ts";

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

/** CORS options. */
export interface CorsOptions extends SharedOptions {
  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?: string;

  /** Called on cross origin request.
   *
   * @defaultValue {@link defaultOnCrossOrigin}
   */
  readonly onCrossOrigin?: (
    headersInit: HeadersInit,
    context: CorsContext,
  ) => Response;
}

/** Preflight options. */
export interface PreflightOptions extends SharedOptions {
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

  /** Called on preflight request.
   *
   * @defaultValue {@link defaultOnPreflight}
   */
  readonly onPreflight?: (
    headersInit: HeadersInit,
    context: RequestContext,
  ) => Response;
}

/** CORS context. */
export interface CorsContext extends RequestContext, ResponseContext {}

/** Request context. */
export interface RequestContext {
  /** Cloned `Request` object. */
  request: Request;
}

/** Response context. */
export interface ResponseContext {
  /** Cloned `Response` object. */
  response: Response;
}

const defaultOnPreflight: Required<PreflightOptions>["onPreflight"] = (
  headersInit,
) => {
  const status = Status.NoContent;

  return new Response(null, {
    headers: headersInit,
    status,
    statusText: STATUS_TEXT[status],
  });
};

const defaultOnCrossOrigin: Required<CorsOptions>["onCrossOrigin"] = (
  headerInit,
  { response },
) => {
  const headers = mergeHeaders(new Headers(headerInit), response.headers);

  return new Response(response.body, {
    ...response,
    headers,
  });
};

/** Create preflight response from `Request` object.
 * If the request is preflight request, return response for preflight.
 */
export function preflightResponse(
  request: Request,
  {
    allowCredentials,
    allowOrigin,
    allowHeaders,
    allowMethods,
    maxAge,
    onPreflight = defaultOnPreflight,
  }: PreflightOptions,
): Response | undefined {
  const [valid, context] = validatePreflightRequest(request.clone());

  if (!valid) return;

  const { origin, accessControlRequestHeaders, accessControlRequestMethod } =
    context.headers;
  const headersInit = resolveRequiredPreflightOptions({
    allowOrigin: allowOrigin ?? origin,
    allowHeaders: allowHeaders ?? accessControlRequestHeaders,
    allowMethods: allowMethods ?? accessControlRequestMethod,
    maxAge,
    allowCredentials,
  });

  return onPreflight(headersInit, { request: request.clone() });
}

/** Create CORS response from `Response` and `Request` object.
 * Compute the CORS header from the `Request` and add it to the header of the `Response`.
 */
export function corsResponse(
  request: Request,
  response: Response,
  {
    allowOrigin,
    allowCredentials,
    exposeHeaders,
    onCrossOrigin = defaultOnCrossOrigin,
  }: CorsOptions,
): Response {
  const [valid, requestInit] = validateCorsRequest(request);

  if (!valid) return response;

  const headerInit = resolveRequiredCorsOptions({
    allowOrigin: allowOrigin ?? requestInit.headers.origin,
    allowCredentials,
    exposeHeaders,
  });

  return onCrossOrigin(headerInit, { request, response });
}

function resolveRequiredCorsOptions(
  { allowOrigin, allowCredentials, exposeHeaders }: RequiredBy<
    CorsOptions,
    "allowOrigin"
  >,
): HeadersInit {
  return {
    "access-control-allow-origin": allowOrigin,
    vary: "origin",
    ...resolveAllowCredentials(allowCredentials),
    ...resolveExposeHeaders(exposeHeaders),
  };
}

function resolveRequiredPreflightOptions(
  { allowOrigin, allowHeaders, allowMethods, allowCredentials, maxAge }:
    RequiredBy<
      PreflightOptions,
      "allowOrigin" | "allowMethods" | "allowHeaders"
    >,
): HeadersInit {
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": allowHeaders,
    "access-control-allow-methods": allowMethods,
    vary:
      "origin, access-control-request-headers, access-control-request-method",
    ...resolveAllowCredentials(allowCredentials),
    ...resolveMaxAge(maxAge),
  };
}

function resolveAllowCredentials(
  allowCredentials: SharedOptions["allowCredentials"],
): Nullable<
  { "access-control-allow-credentials": string }
> {
  if (isUndefined(allowCredentials)) return;

  return {
    "access-control-allow-credentials": String(allowCredentials),
  };
}

function resolveMaxAge(
  maxAge: PreflightOptions["maxAge"],
): Nullable<{ "access-control-max-age": string }> {
  if (isUndefined(maxAge)) return;

  return {
    "access-control-max-age": String(maxAge),
  };
}

function resolveExposeHeaders(
  exposeHeaders: CorsOptions["exposeHeaders"],
): Nullable<{ "access-control-expose-headers": string }> {
  if (isUndefined(exposeHeaders)) return;

  return {
    "access-control-expose-headers": exposeHeaders,
  };
}

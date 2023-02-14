// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isUndefined, mergeHeaders } from "./deps.ts";
import {
  Cors,
  Field,
  isCrossOriginRequest,
  isPreflightRequest,
  StrictResponse,
} from "./utils.ts";

export interface Options {
  /** Configures the `Access-Control-Allow-Origin` header.
   *
   * @default "*"
   */
  readonly allowOrigin?: string;

  /** Configures the `Access-Control-Allow-Credentials` header. */
  readonly allowCredentials?:
    | string
    | true;

  /** Configures the `Access-Control-Allow-Method` header.
   *
   * @default `Access-Control-Request-Method` field value
   */
  readonly allowMethods?: string;

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  readonly allowHeaders?: string;

  /** Configures the `Access-Control-Max-Age` header. */
  readonly maxAge?: string | number;

  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?: string;
}

/** Create `Response` with CORS headers.
 * @param request Any request.
 * @param response Any response.
 * @param options CORS header options.
 *
 * @example
 * ```ts
 * import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 *
 * const corsRequest = new Request("http://api.test", {
 *   headers: { origin: "http://cors.test" },
 * });
 * const yourResponse = new Response();
 * const response = withCors(corsRequest, yourResponse);
 *
 * assertEquals(response.headers.get("access-control-allow-origin", "*"));
 * ```
 */
export function withCors(
  request: Request,
  response: Response,
  options?: Options,
): Response {
  const isCrossOrigin = isCrossOriginRequest(request.clone());

  if (!isCrossOrigin) return response;

  const { allowOrigin = STAR } = options ?? {};
  const allowCredentials = options?.allowCredentials?.toString();
  const isPreflight = isPreflightRequest(request);

  if (isPreflight) {
    const requestHeaders = request.headers.get(Cors.RequestHeaders);
    const requestMethod = request.headers.get(Cors.RequestMethod);
    const allowHeaders = options?.allowHeaders ?? requestHeaders;
    const allowMethods = options?.allowMethods ?? requestMethod;
    const maxAge = options?.maxAge?.toString();
    const exposeHeaders = options?.exposeHeaders?.toString();
    const corsHeaders = createPreflightHeaders({
      allowOrigin,
      allowHeaders,
      allowMethods,
      allowCredentials,
      maxAge,
      exposeHeaders,
    });
    const headers = mergeHeaders(response.headers, corsHeaders);
    const corsResponse = new StrictResponse(null, {
      ...response,
      status: 204,
      headers,
    });

    return corsResponse;
  } else {
    const corsHeaders = createCorsHeaders({ allowOrigin, allowCredentials });
    const headers = mergeHeaders(response.headers, corsHeaders);

    return new Response(response.body, { ...response, headers });
  }
}

function createCorsHeaders(
  args: {
    readonly allowOrigin: string;
    readonly allowCredentials?: string;
  },
): Headers {
  const { allowOrigin, allowCredentials } = args;
  const headers = new Headers({ [Cors.AllowOrigin]: allowOrigin });

  if (allowOrigin !== STAR) {
    headers.append(Field.Vary, Field.Origin);
  }

  if (!isUndefined(allowCredentials)) {
    headers.set(Cors.AllowCredentials, allowCredentials);
  }

  return headers;
}
function createPreflightHeaders(
  args: {
    allowOrigin: string;
    allowMethods: string;
    allowHeaders: string;
    allowCredentials?: string;
    maxAge?: string;
    exposeHeaders?: string;
  },
): Headers {
  const {
    allowOrigin,
    allowCredentials,
    allowHeaders,
    allowMethods,
    maxAge,
    exposeHeaders,
  } = args;
  const headers = createCorsHeaders({ allowOrigin, allowCredentials });

  headers.append(Cors.AllowHeaders, allowHeaders);
  headers.append(Cors.AllowMethods, allowMethods);

  if (!isUndefined(maxAge)) {
    headers.append(Cors.MaxAge, maxAge);
  }

  if (!isUndefined(exposeHeaders)) {
    headers.append(Cors.ExposeHeaders, exposeHeaders);
  }

  return headers;
}

const STAR = "*";

import { Handler, isFunction, OmitBy } from "./deps.ts";
import {
  CorsContext,
  corsResponse,
  preflightResponse,
  RequestContext,
} from "./responses.ts";

/** CORS handler options. */
export interface HandlerOptions {
  /** Configures the `Access-Control-Allow-Origin` header.
   *
   * @default `Origin` field value
   */
  readonly allowOrigin?: string | ((context: RequestContext) => string);

  /** Configures the `Access-Control-Allow-Methods` header.
   *
   * @default `Access-Control-Request-Methods` field value
   */
  readonly allowMethods?: string | ((context: RequestContext) => string);

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  readonly allowHeaders?: string | ((context: RequestContext) => string);

  /** Configures the `Access-Control-Allow-Credentials` header. */
  readonly allowCredentials?:
    | string
    | true
    | ((context: RequestContext) => string | true);

  /** Configures the `Access-Control-Max-Age` header. */
  readonly maxAge?:
    | string
    | number
    | ((context: RequestContext) => string | number);

  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?: string | ((context: RequestContext) => string);

  /** Called on cross origin request.
   *
   * @defaultValue {@link defaultOnCrossOrigin}
   */
  readonly onCrossOrigin?: (
    headersInit: HeadersInit,
    context: CorsContext,
  ) => Response;

  /** Called on preflight request.
   *
   * @defaultValue {@link defaultOnPreflight}
   */
  readonly onPreflight?: (
    headersInit: HeadersInit,
    context: RequestContext,
  ) => Response;
}

/** Adds CORS functionality to the handler. And it returns a new handler.
 * ```ts
 * import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
 * import { serve } from "https://deno.land/std@$VERSION/http/mod.ts";
 *
 * function handler(req: Request): Response {
 *   return new Response("Hello");
 * }
 *
 * await serve(withCors(handler));
 * ```
 */
export function withCors(
  handler: Handler,
  options: HandlerOptions = {},
): Handler {
  return async (request) => {
    const staticOptions = resolveDynamicOptions(options, {
      request: request.clone(),
    });
    const maybePreflightResponse = preflightResponse(request, {
      onPreflight: options.onPreflight,
      ...staticOptions,
    });

    if (maybePreflightResponse) return maybePreflightResponse;

    const response = await handler(request);

    return corsResponse(request, response, {
      onCrossOrigin: options.onCrossOrigin,
      ...staticOptions,
    });
  };
}

// deno-lint-ignore ban-types
type StaticHandlerOptions = OmitBy<HandlerOptions, Function>;

function resolveDynamicOptions(
  {
    allowOrigin,
    allowMethods,
    allowCredentials,
    allowHeaders,
    maxAge,
    exposeHeaders,
  }: HandlerOptions,
  context: RequestContext,
): StaticHandlerOptions {
  if (isFunction(allowOrigin)) {
    allowOrigin = allowOrigin(context);
  }
  if (isFunction(allowMethods)) {
    allowMethods = allowMethods(context);
  }
  if (isFunction(allowHeaders)) {
    allowHeaders = allowHeaders(context);
  }
  if (isFunction(allowCredentials)) {
    allowCredentials = allowCredentials(context);
  }
  if (isFunction(maxAge)) {
    maxAge = maxAge(context);
  }
  if (isFunction(exposeHeaders)) {
    exposeHeaders = exposeHeaders(context);
  }

  return {
    allowOrigin,
    allowMethods,
    allowHeaders,
    allowCredentials,
    maxAge,
    exposeHeaders,
  };
}

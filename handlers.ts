import { Handler } from "./deps.ts";
import {
  CorsOptions,
  corsResponse,
  PreflightOptions,
  preflightResponse,
} from "./responses.ts";

// /** Context of runtime data. */
export interface RuntimeContext {
  /** Cloned `Request` object. */
  readonly request: Request;
}

/** CORS handler options. */
export interface HandlerOptions extends CorsOptions, PreflightOptions {}

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
  return async (req) => {
    const maybePreflightResponse = preflightResponse(req, options);

    if (maybePreflightResponse) return maybePreflightResponse;

    const res = await handler(req);

    return corsResponse(req, res, options);
  };
}

import { Status, STATUS_TEXT } from "./deps.ts";
import { validateCorsRequest, validatePreflightRequest } from "./utils.ts";

/** CORS protocol headers. */
export interface CorsHeaders {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Credentials": string;
  "Access-Control-Allow-Headers": string;
  "Access-Control-Allow-Methods": string;
  "Access-Control-Max-Age": string;
  "Access-Control-Expose-Headers": string;
}

export function cors(
  req: Request,
  res: Response,
  { headers }: Partial<Options> = {},
): Promise<Response> | Response {
  const result = validateCorsRequest(req);
  if (!result[0]) return res;
  const [valid] = validatePreflightRequest(req);

  if (valid) return createPreflightResponse(req, headers);

  const origin = result[1].headers.origin;
  const accessControlAllowOrigin = headers?.["Access-Control-Allow-Origin"] ??
    origin;
  const maybeAccessControlAllowCredentials = headers
    ?.["Access-Control-Allow-Credentials"];

  const newRes = res.clone();
  newRes.headers.set("Access-Control-Allow-Origin", accessControlAllowOrigin);
  if (maybeAccessControlAllowCredentials) {
    newRes.headers.set(
      "Access-Control-Allow-Credentials",
      String(maybeAccessControlAllowCredentials),
    );
  }
  if (headers?.["Access-Control-Expose-Headers"]) {
    newRes.headers.set(
      "Access-Control-Expose-Headers",
      headers["Access-Control-Expose-Headers"],
    );
  }
  return newRes;
}

/** HTTP request handler. */
export type Handler = (req: Request) => Promise<Response> | Response;

/** Options. */
export interface Options {
  readonly headers?: Partial<CorsHeaders>;
}

/** Create a handler that supports the CORS protocol.
 *
 * ```ts
 * import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
 * import { Handler, serve } from "https://deno.land/std@$VERSION/http/mod.ts";
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
  { headers }: Options = {},
): Handler {
  return async (req) => {
    try {
      const res = await handler(req);
      return cors(req, res, { headers });
    } catch {
      return new Response(null, {
        status: Status.InternalServerError,
        statusText: STATUS_TEXT[Status.InternalServerError],
      });
    }
  };
}

function parseHeader(headerValue: string | null): string[] {
  return headerValue?.split(",").map(trim).filter((value) => !!value) ?? [];
}

function trim(value: string): string {
  return value.trim();
}

function stringifyHeader(headers: ReadonlyArray<string>): string {
  return headers.join(",");
}

function createPreflightResponse(
  req: Request,
  _headers: Partial<CorsHeaders> | undefined,
): Response {
  const origin = req.headers.get("Origin")!;
  const accessControlAllowOrigin = _headers?.["Access-Control-Allow-Origin"] ??
    origin;
  const maybeAccessControlAllowCredentials = _headers
    ?.["Access-Control-Allow-Credentials"];

  const accessControlRequestHeaders = req.headers.get(
    "Access-Control-Request-Headers",
  )!;
  const accessControlAllowHeaders =
    _headers?.["Access-Control-Allow-Headers"] ??
      accessControlRequestHeaders;
  const accessControlRequestMethod = req.headers.get(
    "Access-Control-Request-Method",
  )!;
  const accessControlRequestMethods = Array.from(
    new Set([...parseHeader(accessControlRequestMethod), "OPTIONS"]),
  );
  const accessControlAllowMethods =
    _headers?.["Access-Control-Allow-Methods"] ??
      stringifyHeader(
        accessControlRequestMethods,
      );
  const headers = new Headers({
    "Access-Control-Allow-Origin": accessControlAllowOrigin,
    "Access-Control-Allow-Methods": accessControlAllowMethods,
    "Access-Control-Allow-Headers": accessControlAllowHeaders,
  });

  if (maybeAccessControlAllowCredentials) {
    headers.set(
      "Access-Control-Allow-Credentials",
      maybeAccessControlAllowCredentials,
    );
  }
  if (_headers?.["Access-Control-Max-Age"]) {
    headers.set(
      "Access-Control-Max-Age",
      _headers["Access-Control-Max-Age"],
    );
  }

  const status = Status.NoContent;
  return new Response(null, {
    status,
    statusText: STATUS_TEXT[status],
    headers,
  });
}

import { Status, STATUS_TEXT } from "./deps.ts";

export type CorsHeaders = {
  "Access-Control-Allow-Origin": string;
  // deno-lint-ignore ban-types
  "Access-Control-Allow-Credentials": (string & {}) | "true" | true;
  "Access-Control-Allow-Headers": string;
  "Access-Control-Allow-Methods": string;
  "Access-Control-Max-Age": string | number;
  "Access-Control-Expose-Headers": string;
};

export function cors(
  req: Request,
  res: Response,
  headers: Partial<CorsHeaders> = {},
): Promise<Response> | Response {
  if (isCorsRequest(req)) {
    const origin = req.headers.get("Origin")!;
    const accessControlAllowOrigin = headers["Access-Control-Allow-Origin"] ??
      origin;
    const accessControlAllowCredentials =
      headers["Access-Control-Allow-Credentials"];

    if (isPreflightRequest(req)) {
      const accessControlRequestHeaders = req.headers.get(
        "Access-Control-Request-Headers",
      )!;
      const accessControlAllowHeaders =
        headers["Access-Control-Allow-Headers"] ?? accessControlRequestHeaders;
      const accessControlRequestMethod = req.headers.get(
        "Access-Control-Request-Method",
      )!;
      const accessControlRequestMethods = Array.from(
        new Set([...parseHeader(accessControlRequestMethod), "OPTIONS"]),
      );
      const accessControlAllowMethods =
        headers["Access-Control-Allow-Methods"] ?? stringifyHeader(
          accessControlRequestMethods,
        );
      const _headers = new Headers({
        "Access-Control-Allow-Origin": accessControlAllowOrigin,
        "Access-Control-Allow-Methods": accessControlAllowMethods,
        "Access-Control-Allow-Headers": accessControlAllowHeaders,
      });

      if (accessControlAllowCredentials) {
        _headers.set(
          "Access-Control-Allow-Credentials",
          String(accessControlAllowCredentials),
        );
      }
      if (headers["Access-Control-Max-Age"]) {
        _headers.set(
          "Access-Control-Max-Age",
          String(headers["Access-Control-Max-Age"]),
        );
      }

      return new Response(null, {
        status: Status.NoContent,
        statusText: STATUS_TEXT[Status.NoContent],
        headers: _headers,
      });
    }

    res.headers.set("Access-Control-Allow-Origin", accessControlAllowOrigin);
    if (accessControlAllowCredentials) {
      res.headers.set(
        "Access-Control-Allow-Credentials",
        String(accessControlAllowCredentials),
      );
    }
    if (headers["Access-Control-Expose-Headers"]) {
      res.headers.set(
        "Access-Control-Expose-Headers",
        headers["Access-Control-Expose-Headers"],
      );
    }
  }
  return res;
}

export type Handler = (req: Request) => Promise<Response> | Response;

export type Options = { headers: Partial<CorsHeaders> };

/** Create a handler that supports the CORS protocol.
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
  { headers }: Readonly<Partial<Options>> = {},
): Handler {
  return async (req) => {
    try {
      const res = await handler(req);
      return cors(req, res, headers);
    } catch {
      return new Response(null, {
        status: Status.InternalServerError,
        statusText: STATUS_TEXT[Status.InternalServerError],
      });
    }
  };
}

export function isCorsRequest(req: Request): boolean {
  return req.headers.has("origin");
}

export function isPreflightRequest(req: Request): boolean {
  return req.method === "OPTIONS" &&
    req.headers.has("Access-Control-Request-Method") &&
    req.headers.has("Access-Control-Request-Headers");
}

function parseHeader(headerValue: string | null): string[] {
  return headerValue?.split(",").map((value) => value.trim()) ?? [];
}

function stringifyHeader(headers: readonly string[]): string {
  return headers.join(",");
}

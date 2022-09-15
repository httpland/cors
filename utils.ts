/** Whether the request is cors request or not.
 * Living Standard - Fetch, 3.2.2 HTTP requests
 */
export function isCorsRequest(req: Request): boolean {
  return req.headers.has("origin") && !isSameOriginRequest(req);
}

export function isSameOriginRequest(req: Request): boolean {
  const originFromHeader = req.headers.get("origin");

  try {
    // just to be sure
    const origin = new URL(req.url).origin;
    return origin === originFromHeader;
  } catch {
    return false;
  }
}

/** Whether the request is preflight request or not.
 * Living Standard - Fetch, 3.2.2 HTTP requests
 */
export function isPreflightRequest(req: Request): boolean {
  return isCorsRequest(req) &&
    req.method === "OPTIONS" &&
    req.headers.has("Access-Control-Request-Method") &&
    req.headers.has("Access-Control-Request-Headers");
}

/** Validate the request is cors request or not. */
export function validateCorsRequest(
  req: Request,
): [valid: true, requestInit: { headers: { origin: string } }] | [
  valid: false,
] {
  if (isCorsRequest(req)) {
    return [true, { headers: { origin: req.headers.get("origin")! } }];
  }
  return [false];
}

/** Validate the request is preflight request or not. */
export function validatePreflightRequest(
  req: Request,
): [valid: true, requestInit: {
  method: "OPTIONS";
  headers: {
    accessControlRequestMethod: string;
    accessControlRequestHeaders: string;
  };
}] | [valid: false] {
  if (isPreflightRequest(req)) {
    return [true, {
      method: req.method as "OPTIONS",
      headers: {
        accessControlRequestMethod: req.headers.get(
          "Access-Control-Request-Method",
        )!,
        accessControlRequestHeaders: req.headers.get(
          "Access-Control-Request-Headers",
        )!,
      },
    }];
  }
  return [false];
}
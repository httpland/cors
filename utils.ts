/** Whether the request is cors request or not.
 * Living Standard - Fetch, 3.2.2 HTTP requests
 */
export function isCrossOriginRequest(req: Request): boolean {
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
  return isCrossOriginRequest(req) &&
    req.method === "OPTIONS" &&
    req.headers.has("access-control-request-method") &&
    req.headers.has("access-control-request-headers");
}

/** Validate the request is cors request or not. */
export function validateCorsRequest(
  req: Request,
): [valid: true, requestInit: { headers: { origin: string } }] | [
  valid: false,
] {
  if (isCrossOriginRequest(req)) {
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
          "access-control-request-method",
        )!,
        accessControlRequestHeaders: req.headers.get(
          "access-control-request-headers",
        )!,
      },
    }];
  }
  return [false];
}

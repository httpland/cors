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

/** Whether the request is cors request or not.
 * Living Standard - Fetch, 3.2.2 HTTP requests
 */
export function isCorsRequest(req: Request): boolean {
  return req.headers.has("origin");
}

/** Validate the request is preflight request or not. */
export function validatePreflightRequest(
  corsReq: Request,
): [valid: true, requestInit: {
  method: "OPTIONS";
  headers: {
    "Access-Control-Request-Method": string;
    "Access-Control-Request-Headers": string;
  };
}] | [valid: false] {
  if (isCorsPreflightRequest(corsReq)) {
    return [true, {
      method: corsReq.method as "OPTIONS",
      headers: {
        "Access-Control-Request-Method": corsReq.headers.get(
          "Access-Control-Request-Method",
        )!,
        "Access-Control-Request-Headers": corsReq.headers.get(
          "Access-Control-Request-Headers",
        )!,
      },
    }];
  }
  return [false];
}

/** Whether the request is preflight request or not.
 * Living Standard - Fetch, 3.2.2 HTTP requests
 */
export function isCorsPreflightRequest(req: Request): boolean {
  return isCorsRequest(req) &&
    req.method === "OPTIONS" &&
    req.headers.has("Access-Control-Request-Method") &&
    req.headers.has("Access-Control-Request-Headers");
}

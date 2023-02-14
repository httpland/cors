// Copyright 2023-latest the httpland authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isNull } from "./deps.ts";

/** CORS header field. */
export enum Cors {
  AllowOrigin = "access-control-allow-origin",
  AllowCredentials = "access-control-allow-credentials",
  AllowMethods = "access-control-allow-methods",
  AllowHeaders = "access-control-allow-headers",
  ExposeHeaders = "access-control-expose-headers",
  MaxAge = "access-control-max-age",
  RequestMethod = "access-control-request-method",
  RequestHeaders = "access-control-request-headers",
}

export enum Field {
  Vary = "vary",
  Origin = "origin",
  ContentType = "content-type",
  ContentLength = "content-length",
}

/** Header strict `Response`. */
export class StrictResponse extends Response {
  constructor(
    body?: BodyInit | null | undefined,
    init?: ResponseInit | undefined,
  ) {
    const hasContent = !!body;

    super(body, init);

    if (!hasContent) {
      this.headers.delete(Field.ContentType);
      this.headers.delete(Field.ContentLength);
    }
  }
}

/** Whether the request is preflight request or not.
 * Living Standard - Fetch, 3.2.2 HTTP requests
 */
export function isPreflightRequest(
  request: Request,
): request is PreflightRequest {
  return isCrossOriginRequest(request) &&
    request.method === "OPTIONS" &&
    request.headers.has(Cors.RequestHeaders) &&
    request.headers.has(Cors.RequestMethod);
}

export type PreflightHeaderField =
  | "origin"
  | "access-control-request-method"
  | "access-control-request-headers";

export interface PreflightHeaders extends Headers {
  get(name: PreflightHeaderField): string;
  get(name: string): string | null;
}

export interface PreflightRequest extends Request {
  method: "OPTIONS";
  headers: PreflightHeaders;
}

export function isCrossOriginRequest(
  request: Request,
): request is Request & { headers: { get(name: "origin"): string } } {
  const origin = request.headers.get(Field.Origin);

  if (isNull(origin)) return false;

  try {
    const url = new URL(request.url);
    const originURL = new URL(origin);

    return !isSameOrigin(url, originURL);
  } catch {
    return false;
  }
}

export function isSameOrigin(left: URL, right: URL): boolean {
  return left.origin === right.origin;
}

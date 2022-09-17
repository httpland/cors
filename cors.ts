import { validateCorsRequest, validatePreflightRequest } from "./utils.ts";
import {
  Handler,
  isFunction,
  isString,
  isUndefined,
  KeyValue,
  mergeHeaders,
  Status,
  STATUS_TEXT,
  ValueOf,
} from "./deps.ts";

/** CORS options. */
export interface CorsOptions {
  /** Configures the `Access-Control-Allow-Origin` header.
   *
   * @default `Origin` field value
   */
  readonly allowOrigin?: string | ((origin: string) => string);

  /** Configures the `Access-Control-Allow-Methods` header.
   *
   * @default `Access-Control-Request-Methods` field value
   */
  readonly allowMethods?:
    | string
    | ((accessControlAllowMethod: string) => string);

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  readonly allowHeaders?:
    | string
    | ((accessControlRequestHeaders: string) => string);

  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?: string;

  /** Configures the `Access-Control-Allow-Credentials` header. */
  readonly allowCredentials?: string | true;

  /** Configures the `Access-Control-Max-Age` header. */
  readonly maxAge?: string | number;
}

export function withCors(handler: Handler, {
  maxAge,
  allowCredentials,
  allowHeaders,
  allowMethods,
  exposeHeaders,
  allowOrigin,
}: CorsOptions = {}): Handler {
  return async (req) => {
    const result = validateCorsRequest(req);

    if (!result[0]) return handler(req);

    const { origin } = result[1].headers;
    const [isPreflight, resInit] = validatePreflightRequest(req);
    const res = await handler(req);

    if (!isPreflight) {
      const headerInit = resolveSimpleRequestOptions({
        allowCredentials,
        exposeHeaders,
        allowOrigin,
      }, { origin });

      const headers = mergeHeaders(new Headers(headerInit), res.headers);
      return new Response(res.body, {
        ...res,
        headers,
      });
    }

    const {
      accessControlRequestHeaders,
      accessControlRequestMethod,
    } = resInit.headers;

    const headerInit = resolvePreflightOptions({
      maxAge,
      allowCredentials,
      allowHeaders,
      allowMethods,
      allowOrigin,
    }, {
      origin,
      accessControlRequestHeaders,
      accessControlRequestMethod,
    });
    const headers = mergeHeaders(new Headers(headerInit), res.headers);
    const status = Status.NoContent;

    return new Response(null, {
      status,
      statusText: STATUS_TEXT[status],
      headers,
    });
  };
}

type PreflightDefinition = Pick<
  CorsOptions,
  | "allowOrigin"
  | "allowHeaders"
  | "allowMethods"
  | "allowCredentials"
  | "maxAge"
>;
type SimpleRequestDefinition = Pick<
  CorsOptions,
  "allowOrigin" | "allowCredentials" | "exposeHeaders"
>;

function resolvePreflightOptions(
  { allowOrigin, allowCredentials, allowHeaders, allowMethods, maxAge }:
    PreflightDefinition,
  { origin, accessControlRequestHeaders, accessControlRequestMethod }:
    PreflightHeaders,
): Record<string, string> {
  allowOrigin = resolveDynamicDefinition(origin, allowOrigin);
  allowCredentials = resolveStaticDefinition(allowCredentials);
  allowHeaders = resolveDynamicDefinition(
    accessControlRequestHeaders,
    allowHeaders,
  );
  allowMethods = resolveDynamicDefinition(
    accessControlRequestMethod,
    allowMethods,
  );
  maxAge = resolveStaticDefinition(maxAge);

  const maxAgeSet = ["access-control-max-age", maxAge] as const;
  const credentialsSet = [
    "access-control-allow-credentials",
    allowCredentials,
  ] as const;
  const varySet: KeyValue = [
    "vary",
    [
      "origin",
      "access-control-request-headers",
      "access-control-request-methods",
    ]
      .join(", "),
  ];
  const originSet = ["access-control-allow-origin", allowOrigin] as const;
  const allowHeadersSet = [
    "access-control-allow-headers",
    allowHeaders,
  ] as const;
  const allowMethodsSet = [
    "access-control-allow-methods",
    allowMethods,
  ] as const;

  return Object.fromEntries(
    filterKeyValueEntries([
      originSet,
      allowHeadersSet,
      allowMethodsSet,
      credentialsSet,
      maxAgeSet,
    ]).concat([varySet]),
  );
}

interface PreflightHeaders {
  readonly origin: string;
  readonly accessControlRequestMethod: string;
  readonly accessControlRequestHeaders: string;
}

function resolveSimpleRequestOptions(
  { allowOrigin, allowCredentials, exposeHeaders }: SimpleRequestDefinition,
  { origin }: Pick<PreflightHeaders, "origin">,
): Record<string, string> {
  allowOrigin = resolveDynamicDefinition(origin, allowOrigin);
  allowCredentials = resolveStaticDefinition(allowCredentials);
  exposeHeaders = resolveStaticDefinition(exposeHeaders);

  const originSet = ["access-control-allow-origin", allowOrigin] as const;
  const exposeHeadersSet = [
    "access-control-expose-headers",
    exposeHeaders,
  ] as const;
  const credentialsSet = [
    "access-control-allow-credentials",
    allowCredentials,
  ] as const;
  const varySet: KeyValue = ["vary", "origin"];

  return Object.fromEntries(
    filterKeyValueEntries(
      [originSet, exposeHeadersSet, credentialsSet],
    ).concat(
      [varySet],
    ),
  );
}

function filterKeyValueEntries(
  entries: readonly (readonly [string, string | undefined])[],
): KeyValue[] {
  return entries.filter(([_, value]) => isString(value)) as KeyValue[];
}

type RequiredDefinition = Pick<
  CorsOptions,
  "allowOrigin" | "allowHeaders" | "allowMethods"
>;
type OptionalDefinition = Pick<
  CorsOptions,
  "allowCredentials" | "exposeHeaders" | "maxAge"
>;

function resolveDynamicDefinition(
  fieldValue: string,
  definition: ValueOf<RequiredDefinition>,
): string {
  if (isFunction(definition)) {
    return definition(fieldValue);
  }

  return definition ?? fieldValue;
}

function resolveStaticDefinition(
  definition: ValueOf<OptionalDefinition>,
): string | undefined {
  if (isUndefined(definition)) return;

  return definition.toString();
}

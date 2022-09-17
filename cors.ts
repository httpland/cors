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

/** Context of dynamic definition. */
export interface DynamicContext {
  /** Cloned `Request` object. */
  readonly request: Request;

  /** Cloned `Response` object. */
  readonly response: Response;
}

/** CORS options. */
export interface CorsOptions {
  /** Configures the `Access-Control-Allow-Origin` header.
   *
   * @default `Origin` field value
   */
  readonly allowOrigin?:
    | string
    | ((origin: string, context: DynamicContext) => string | undefined);

  /** Configures the `Access-Control-Allow-Methods` header.
   *
   * @default `Access-Control-Request-Methods` field value
   */
  readonly allowMethods?:
    | string
    | ((
      accessControlAllowMethod: string,
      context: DynamicContext,
    ) => string | undefined);

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  readonly allowHeaders?:
    | string
    | ((
      accessControlRequestHeaders: string,
      context: DynamicContext,
    ) => string | undefined);

  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?:
    | string
    | ((context: DynamicContext) => string | undefined);

  /** Configures the `Access-Control-Allow-Credentials` header. */
  readonly allowCredentials?:
    | string
    | true
    | ((context: DynamicContext) => string | true | undefined);

  /** Configures the `Access-Control-Max-Age` header. */
  readonly maxAge?:
    | string
    | number
    | ((context: DynamicContext) => string | number | undefined);
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
    const result = validateCorsRequest(req.clone());

    if (!result[0]) return handler(req.clone());

    const { origin } = result[1].headers;
    const [isPreflight, resInit] = validatePreflightRequest(req.clone());
    const res = await handler(req.clone());
    const context: DynamicContext = {
      request: req.clone(),
      response: res.clone(),
    };

    if (!isPreflight) {
      const headerInit = resolveSimpleRequestOptions(
        {
          allowCredentials,
          exposeHeaders,
          allowOrigin,
        },
        { origin },
        context,
      );

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
    }, context);
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

export function resolvePreflightOptions(
  { allowOrigin, allowCredentials, allowHeaders, allowMethods, maxAge }:
    PreflightDefinition,
  { origin, accessControlRequestHeaders, accessControlRequestMethod }:
    PreflightHeaders,
  context: DynamicContext,
): Record<string, string> {
  allowOrigin = resolveRequiredDefinition(origin, allowOrigin, context);
  allowCredentials = resolveOptionalDefinition(allowCredentials, context);
  allowHeaders = resolveRequiredDefinition(
    accessControlRequestHeaders,
    allowHeaders,
    context,
  );
  allowMethods = resolveRequiredDefinition(
    accessControlRequestMethod,
    allowMethods,
    context,
  );
  maxAge = resolveOptionalDefinition(maxAge, context);

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

export function resolveSimpleRequestOptions(
  { allowOrigin, allowCredentials, exposeHeaders }: SimpleRequestDefinition,
  { origin }: Pick<PreflightHeaders, "origin">,
  context: DynamicContext,
): Record<string, string> {
  allowOrigin = resolveRequiredDefinition(origin, allowOrigin, context);
  allowCredentials = resolveOptionalDefinition(allowCredentials, context);
  exposeHeaders = resolveOptionalDefinition(exposeHeaders, context);

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

function resolveRequiredDefinition(
  fieldValue: string,
  definition: ValueOf<RequiredDefinition>,
  context: DynamicContext,
): string {
  const result = isFunction(definition)
    ? definition(fieldValue, context)
    : definition;

  return result ?? fieldValue;
}

function resolveOptionalDefinition(
  definition: ValueOf<OptionalDefinition>,
  context: DynamicContext,
): string | undefined {
  const result = isFunction(definition) ? definition(context) : definition;

  return resolveStaticDefinition(result);
}

function resolveStaticDefinition(
  // deno-lint-ignore ban-types
  definition: Exclude<ValueOf<CorsOptions>, Function>,
): string | undefined {
  if (isUndefined(definition)) return;

  return definition.toString();
}

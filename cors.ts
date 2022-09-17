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

/** Context of runtime data. */
export interface RuntimeContext {
  /** Cloned `Request` object. */
  readonly request: Request;
}

/** Context of all data. */
export interface CorsContext extends RuntimeContext {
  /** Actual handler. */
  readonly handler: Handler;
}

/** CORS options. */
export interface CorsOptions {
  /** Configures the `Access-Control-Allow-Origin` header.
   *
   * @default `Origin` field value
   */
  readonly allowOrigin?:
    | string
    | ((origin: string, context: RuntimeContext) => string | undefined);

  /** Configures the `Access-Control-Allow-Methods` header.
   *
   * @default `Access-Control-Request-Methods` field value
   */
  readonly allowMethods?:
    | string
    | ((
      accessControlAllowMethod: string,
      context: RuntimeContext,
    ) => string | undefined);

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  readonly allowHeaders?:
    | string
    | ((
      accessControlRequestHeaders: string,
      context: RuntimeContext,
    ) => string | undefined);

  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?:
    | string
    | ((context: RuntimeContext) => string | undefined);

  /** Configures the `Access-Control-Allow-Credentials` header. */
  readonly allowCredentials?:
    | string
    | true
    | ((context: RuntimeContext) => string | true | undefined);

  /** Configures the `Access-Control-Max-Age` header. */
  readonly maxAge?:
    | string
    | number
    | ((context: RuntimeContext) => string | number | undefined);

  /** Event handler called on preflight request.
   * Returns the actual `Response`.
   *
   * @defaultValue {@link defaultPreflightResponse}
   */
  readonly onPreflightRequest?: (
    headers: Headers,
    context: CorsContext,
  ) => Response | Promise<Response>;

  /** Event handler called on simple request.
   * Returns the actual `Response`.
   *
   * @defaultValue {@link defaultSimpleResponse}
   */
  readonly onSimpleRequest?: (
    headers: Headers,
    context: CorsContext,
  ) => Promise<Response> | Response;
}

const defaultPreflightResponse: Required<CorsOptions>["onPreflightRequest"] = (
  headers,
) => {
  const status = Status.NoContent;
  const statusText = STATUS_TEXT[status];

  return new Response(null, { headers, status, statusText });
};

const defaultSimpleResponse: Required<CorsOptions>["onSimpleRequest"] = async (
  headers,
  { request, handler },
) => {
  const res = await handler(request);
  headers = mergeHeaders(headers, res.headers);

  return new Response(res.body, {
    ...res,
    headers,
  });
};

export function withCors(handler: Handler, {
  maxAge,
  allowCredentials,
  allowHeaders,
  allowMethods,
  exposeHeaders,
  allowOrigin,
  onPreflightRequest = defaultPreflightResponse,
  onSimpleRequest = defaultSimpleResponse,
}: CorsOptions = {}): Handler {
  return (req) => {
    const result = validateCorsRequest(req.clone());

    if (!result[0]) return handler(req.clone());

    const { origin } = result[1].headers;
    const [isPreflight, resInit] = validatePreflightRequest(req.clone());
    const runtimeContext: RuntimeContext = {
      request: req.clone(),
    };
    const context: CorsContext = {
      request: req.clone(),
      handler,
    };

    if (isPreflight) {
      const headerInit = resolvePreflightOptions(
        {
          maxAge,
          allowCredentials,
          allowHeaders,
          allowMethods,
          allowOrigin,
        },
        { origin, ...resInit.headers },
        runtimeContext,
      );
      const headers = new Headers(headerInit);

      return onPreflightRequest(headers, context);
    }

    const headerInit = resolveSimpleRequestOptions(
      {
        allowCredentials,
        exposeHeaders,
        allowOrigin,
      },
      { origin },
      runtimeContext,
    );
    const headers = new Headers(headerInit);

    return onSimpleRequest(headers, context);
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
  context: RuntimeContext,
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
  context: RuntimeContext,
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
  context: RuntimeContext,
): string {
  const result = isFunction(definition)
    ? definition(fieldValue, context)
    : definition;

  return resolveStaticDefinition(result) ?? fieldValue;
}

function resolveOptionalDefinition(
  definition: ValueOf<OptionalDefinition>,
  context: RuntimeContext,
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

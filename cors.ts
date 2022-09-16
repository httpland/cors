import { validateCorsRequest, validatePreflightRequest } from "./utils.ts";
import {
  ACCESS_CONTROL_ALLOW_CREDENTIALS,
  ACCESS_CONTROL_ALLOW_HEADERS,
  ACCESS_CONTROL_ALLOW_METHODS,
  ACCESS_CONTROL_ALLOW_ORIGIN,
  ACCESS_CONTROL_EXPOSE_HEADERS,
  ACCESS_CONTROL_MAX_AGE,
} from "./constants.ts";
import {
  filterTruthy,
  Handler,
  isFunction,
  isUndefined,
  KeyValue,
  mergeHeaders,
  Nullable,
  safeResponse,
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
  readonly allowOrigin?: string | DynamicDefinition;

  /** Configures the `Access-Control-Allow-Methods` header.
   *
   * @default `Access-Control-Request-Methods` field value
   */
  readonly allowMethods?: string | DynamicDefinition;

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  readonly allowHeaders?: string | DynamicDefinition;

  /** Configures the `Access-Control-Expose-Headers` header. */
  readonly exposeHeaders?: string;

  /** Configures the `Access-Control-Allow-Credentials` header. */
  readonly allowCredentials?: string | true;

  /** Configures the `Access-Control-Max-Age` header. */
  readonly maxAge?: string | number;

  readonly debug?: boolean;
}

type DynamicDefinition<T = string> = (
  fieldValue: string,
) => T;

type CorsHeaderOptions = Omit<CorsOptions, "debug">;
type CorsOptionsDefinition = ValueOf<CorsHeaderOptions>;

function resolveDefinition(
  fieldName: string,
  definition: CorsOptionsDefinition,
  defaultValue?: string,
): Nullable<KeyValue> {
  if (isUndefined(definition)) {
    return isUndefined(defaultValue) ? undefined : [fieldName, defaultValue];
  }

  if (isFunction(definition)) {
    return isUndefined(defaultValue)
      ? undefined
      : [fieldName, definition(defaultValue)];
  }

  return [fieldName, String(definition)];
}

export function withCors(
  handler: Handler,
  {
    debug,
    maxAge,
    allowCredentials,
    allowHeaders,
    allowMethods,
    exposeHeaders,
    allowOrigin,
  }: CorsOptions = {},
): Handler {
  const credentialsSet = resolveDefinition(
    ACCESS_CONTROL_ALLOW_CREDENTIALS,
    allowCredentials,
  );
  const exposeSet = resolveDefinition(
    ACCESS_CONTROL_EXPOSE_HEADERS,
    exposeHeaders,
  );
  const maxAgeSet = resolveDefinition(
    ACCESS_CONTROL_MAX_AGE,
    maxAge,
  );

  const onSameOrigin: RequestEventHandlerMap["onSameOrigin"] = handler;

  const onCrossOrigin: RequestEventHandlerMap["onCrossOrigin"] = async (
    req,
    { origin },
  ) => {
    const originSet = resolveDefinition(
      ACCESS_CONTROL_ALLOW_ORIGIN,
      allowOrigin,
      origin,
    );

    const headersInit = filterTruthy([originSet, credentialsSet, exposeSet, [
      "Vary",
      "Origin",
    ]]);
    const newH = new Headers(headersInit);
    const res = await handler(req);
    const headers = mergeHeaders(newH, res.headers);

    return new Response(res.body, { ...res, headers });
  };

  const onPreflight: RequestEventHandlerMap["onPreflight"] = (
    _,
    { origin, accessControlRequestHeaders, accessControlRequestMethod },
  ) => {
    const originSet = resolveDefinition(
      ACCESS_CONTROL_ALLOW_ORIGIN,
      allowOrigin,
      origin,
    );
    const methodsSet = resolveDefinition(
      ACCESS_CONTROL_ALLOW_METHODS,
      allowMethods,
      accessControlRequestMethod,
    );
    const allowHeadersSet = resolveDefinition(
      ACCESS_CONTROL_ALLOW_HEADERS,
      allowHeaders,
      accessControlRequestHeaders,
    );

    const headersInit = filterTruthy([
      originSet,
      credentialsSet,
      methodsSet,
      maxAgeSet,
      allowHeadersSet,
      [
        "Vary",
        "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
      ],
    ]);
    const headers = new Headers(headersInit);
    const status = Status.NoContent;

    return new Response(null, {
      status,
      statusText: STATUS_TEXT[status],
      headers,
    });
  };

  const handlerMap: RequestEventHandlerMap = {
    onSameOrigin,
    onCrossOrigin,
    onPreflight,
  };

  return (req) => onRequest(req, handlerMap, debug);
}

function onRequest(
  req: Request,
  { onCrossOrigin, onPreflight, onSameOrigin }: RequestEventHandlerMap,
  debug = false,
): ReturnType<Handler> {
  return safeResponse(() => {
    const validationResult = validateCorsRequest(req);

    if (!validationResult[0]) return onSameOrigin(req);

    const { headers: { origin } } = validationResult[1];
    const result = validatePreflightRequest(req);

    if (!result[0]) {
      return onCrossOrigin(req, { origin });
    }

    const { method, headers } = result[1];

    return onPreflight(req, {
      origin,
      method,
      ...headers,
    });
  }, debug);
}

interface RequestEventHandlerMap {
  onSameOrigin: (req: Request) => ReturnType<Handler>;
  onCrossOrigin: (req: Request, context: CorsContext) => ReturnType<Handler>;
  onPreflight: (req: Request, context: PreflightContext) => ReturnType<Handler>;
}

interface CorsContext {
  origin: string;
}

interface PreflightContext extends CorsContext {
  accessControlRequestMethod: string;
  accessControlRequestHeaders: string;
  method: "OPTIONS";
}

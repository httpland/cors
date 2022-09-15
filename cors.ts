import { validateCorsRequest, validatePreflightRequest } from "./utils.ts";
import {
  filterTruthy,
  Handler,
  isString,
  isUndefined,
  mergeHeaders,
  safeResponse,
  Status,
  STATUS_TEXT,
} from "./deps.ts";

export interface CorsOptions {
  /**
   * Configures the `Access-Control-Allow-Origin` header.
   *
   * @default `Origin` field value
   */
  allowOrigin?: string | Dynamic;

  /**
   * Configures the `Access-Control-Allow-Methods` header.
   *
   * @default `Access-Control-Request-Methods` field value
   */
  allowMethods?: string | Dynamic;

  /** Configures the `Access-Control-Allow-Headers` header.
   *
   * @default `Access-Control-Request-Headers` field value
   */
  allowHeaders?: string | Dynamic;

  /** Configures the `Access-Control-Expose-Headers` header.
   */
  exposeHeaders?: string;

  /** Configures the `Access-Control-Allow-Credentials` header.
   */
  allowCredentials?: boolean;

  /** Configures the `Access-Control-Max-Age` header.
   */
  maxAge?: string | number;

  debug?: boolean;
}

type Dynamic = (fieldValue: string) => string;

const echoHeader: Dynamic = (fieldValue) => fieldValue;

function resolveRequestHeaders(
  definition: CorsOptions["allowHeaders"],
  defaultValue: string,
): KeyValue {
  const value: string = definition
    ? isString(definition) ? definition : definition(defaultValue)
    : defaultValue;

  return ["Access-Control-Allow-Headers", value];
}

function resolveOrigin(
  definition: CorsOptions["allowOrigin"],
  origin: string,
): KeyValue {
  const value = definition
    ? isString(definition) ? definition : definition(origin)
    : origin;

  return ["Access-Control-Allow-Origin", value];
}

function resolveCredential(
  definition: CorsOptions["allowCredentials"],
): Nullable<KeyValue> {
  if (!definition) return;

  return ["Access-Control-Allow-Credentials", "true"];
}

function resolveExpose(
  definition: CorsOptions["exposeHeaders"],
): Nullable<KeyValue> {
  if (!definition) return;

  return ["Access-Control-Expose-Headers", definition];
}

function resolveMethod(
  definition: CorsOptions["allowMethods"],
  defaultValue: string,
): KeyValue {
  const value: string = definition
    ? isString(definition) ? definition : definition(defaultValue)
    : defaultValue;
  return ["Access-Control-Allow-Methods", value];
}

function resolveMaxAge(definition: CorsOptions["maxAge"]): Nullable<KeyValue> {
  if (isUndefined(definition)) return;
  return ["Access-Control-Max-Age", String(definition)];
}

type KeyValue<K = string, V = string> = [key: K, value: V];

type Nullable<T> = T | undefined | null;

interface CorsContext {
  origin: string;
}

interface PreflightContext extends CorsContext {
  accessControlRequestMethod: string;
  accessControlRequestHeaders: string;
  method: "OPTIONS";
}

interface RequestEventHandlerMap {
  onSameOrigin: (req: Request) => ReturnType<Handler>;
  onCrossOrigin: (req: Request, context: CorsContext) => ReturnType<Handler>;
  onPreflight: (req: Request, context: PreflightContext) => ReturnType<Handler>;
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

export function withCors(
  handler: Handler,
  {
    debug,
    allowCredentials,
    exposeHeaders,
    maxAge,
    allowOrigin = echoHeader,
    allowMethods = echoHeader,
    allowHeaders = echoHeader,
  }: CorsOptions = {},
): Handler {
  const credentialsSet = resolveCredential(allowCredentials);
  const exposeSet = resolveExpose(exposeHeaders);

  const onSameOrigin: RequestEventHandlerMap["onSameOrigin"] = (req) =>
    handler(req);

  const onCrossOrigin: RequestEventHandlerMap["onCrossOrigin"] = async (
    req,
    { origin },
  ) => {
    const originSet = resolveOrigin(allowOrigin, origin);
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
    const originSet = resolveOrigin(allowOrigin, origin);
    const methodsSet: KeyValue = resolveMethod(
      allowMethods,
      accessControlRequestMethod,
    );
    const allowHeadersSet: KeyValue = resolveRequestHeaders(
      allowHeaders,
      accessControlRequestHeaders,
    );
    const maxAgeSet = resolveMaxAge(maxAge);

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

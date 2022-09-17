# cors

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/cors_protocol)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/cors_protocol/mod.ts)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/httpland/cors)](https://github.com/httpland/cors/releases)
[![codecov](https://codecov.io/gh/httpland/cors/branch/main/graph/badge.svg?token=nan4NUrx1V)](https://codecov.io/gh/httpland/cors)
[![GitHub](https://img.shields.io/github/license/httpland/cors)](https://github.com/httpland/cors/blob/main/LICENSE)

[![test](https://github.com/httpland/cors/actions/workflows/test.yaml/badge.svg)](https://github.com/httpland/cors/actions/workflows/test.yaml)
[![NPM](https://nodei.co/npm/@httpland/cors.png?mini=true)](https://nodei.co/npm/@httpland/cors/)

CORS protocol for standard `Request` and `Response`.

## What

Add CORS functionality to the handler.

This means that the CORS process can be split from your handler.

## Packages

The package supports multiple platforms.

- deno.land/x - `https://deno.land/x/cors_protocol@$VERSION/mod.ts`
- npm - `@httpland/cors`

## Definition of Terms

```bash
request = same-origin-request | cross-origin-request
preflight request ∈ cross-origin-request
```

- Cross-Origin request - A request that contains `origin` in the HTTP field that
  is not a sequence of `scheme` and `host` in the request URL.
- Same-Origin request - Request that is not a Cross-Origin-request
- Preflight request - A Cross-Origin request whose HTTP request method is
  `OPTIONS` and whose HTTP fields include `access-control-request-headers` and
  `access-control-request-methods`.
- Handler - Function that receives a `Request` object as its first argument and
  returns a `Response` object.

## Add CORS functionality

`withCors` adds CORS functionality to the handler. And it returns a new handler.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
import { serve } from "https://deno.land/std@$VERSION/http/mod.ts";

function handler(req: Request): Response {
  return new Response("Hello");
}

await serve(withCors(handler));
```

The handler handles preflight requests and cross-origin request appropriately.

## Default behavior

The `origin`, `access-control-request-method`, and
`access-control-request-headers` are reflected in the request header as is.

| request header                 | response header              |
| ------------------------------ | ---------------------------- |
| origin                         | access-control-allow-origin  |
| access-control-request-method  | access-control-allow-methods |
| access-control-request-headers | access-control-allow-headers |

Other CORS headers are also fully controllable.

## Customize CORS header

`withCors` has an interface to customize CORS headers. All interfaces accept
`string` or functions with context.

### allowOrigin

Configures the `Access-Control-Allow-Origin` header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";

withCors(() => new Response(), {
  allowOrigin: "null",
});
withCors(() => new Response(), {
  allowOrigin: (origin, context) => {
    return /https?:\/\/api.test.test/.test(origin) ? origin : "null";
  },
});
```

response:

```http
access-control-allow-origin: null
```

### allowMethods

Configures the `Access-Control-Allow-Methods` header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";

withCors(() => new Response(), {
  allowMethods: "GET, POST, PUT",
});
```

response:

```http
access-control-allow-methods: GET, POST, PUT
```

### allowHeaders

Configures the `Access-Control-Allow-Headers` header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";

withCors(() => new Response(), {
  allowHeaders: "content-type, x-custom",
});
```

response:

```http
access-control-allow-headers: content-type, x-custom
```

### allowCredentials

Configures the `Access-Control-Allow-Credentials` header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";

withCors(() => new Response(), {
  allowCredentials: true,
});
```

response:

```http
access-control-allow-credentials: true
```

### maxAge

Configures the `Access-Control-Max-Age` header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";

withCors(() => new Response(), {
  maxAge: 100,
});
```

response:

```http
access-control-max-age: 100
```

### exposeHeaders

Configures the `Access-Control-Expose-Headers` header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";

withCors(() => new Response(), {
  exposeHeaders: "x-custom",
});
```

response:

```http
access-control-expose-headers: x-custom
```

## Customize response

You have complete control over the response.You can define a function that
returns a response.

The first argument, headers, is a CORS header defined by you or by default.

The default behavior is shown below.

### onPreflight

Event handler called on preflight request.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";

withCors(() => new Response(), {
  onPreflight: (headers, context) => {
    return new Response(null, {
      headers,
      status: 204,
      statusText: "No Content",
    });
  },
});
```

### onCrossOrigin

Event handler called on cross origin request expect preflight request.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
import { mergeHeaders } from "https://deno.land/x/http_utils@$VERSION/mod.ts";

withCors(() => new Response(), {
  onCrossOrigin: async (headers, { request, handler }) => {
    const res = await handler(request);
    headers = mergeHeaders(headers, res.headers);

    return new Response(res.body, {
      ...res,
      headers,
    });
  },
});
```

## Spec

Create a handler that returns the following response by default.

### Cross-Origin request

Add the following header to the handler response:

- headers
  - access-control-allow-origin
  - vary

### Preflight request

Create the following response:

- status - `204`
- status text - `No Content`
- headers
  - access-control-allow-origin
  - access-control-request-headers
  - access-control-request-methods
  - vary

## API

All APIs can be found in the
[deno doc](https://doc.deno.land/https/deno.land/x/cors_protocol/mod.ts).

## License

Copyright © 2022-present [httpland](https://github.com/httpland).

Released under the [MIT](./LICENSE) license

# cors

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/cors_protocol)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/cors_protocol/mod.ts)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/httpland/cors)](https://github.com/httpland/cors/releases)
[![codecov](https://codecov.io/gh/httpland/cors/branch/main/graph/badge.svg?token=nan4NUrx1V)](https://codecov.io/gh/httpland/cors)
[![GitHub](https://img.shields.io/github/license/httpland/cors)](https://github.com/httpland/cors/blob/main/LICENSE)

[![test](https://github.com/httpland/cors/actions/workflows/test.yaml/badge.svg)](https://github.com/httpland/cors/actions/workflows/test.yaml)
[![NPM](https://nodei.co/npm/@httpland/cors.png?mini=true)](https://nodei.co/npm/@httpland/cors/)

CORS protocol utilities for standard `Request` and `Response`.

## Packages

The package supports multiple platforms.

- deno.land/x - `https://deno.land/x/cors_protocol@$VERSION/mod.ts`
- npm - `@httpland/cors`

## Definition of Terms

```bash
request = same-origin-request | cross-origin-request
preflight request ∈ cross-origin-request
```

- Cross-Origin request - A request that contains `origin` in the HTTP header
  field.
- Same-Origin request - Request that is not a Cross-Origin-request
- Preflight request - A Cross-Origin request whose HTTP request method is
  `OPTIONS` and whose HTTP header fields include
  `access-control-request-headers` and `access-control-request-method`.

## CORS response

When a cross-origin request arrives, a response containing a CORS header should
be returned. `withCors` returns a new `Response` object from the `Request` and
`Response` that satisfies CORS.

CORS request:

Add the `access-control-allow-origin` header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const corsRequest = new Request("http://api.test", {
  headers: { origin: "http://cors.test" },
});
const yourResponse = new Response();
const response = withCors(corsRequest, yourResponse);

assertEquals(response.headers.get("access-control-allow-origin", "*"));
```

CORS preflight request:

Add `access-control-allow-origin`, `access-control-allow-methods` and
`access-control-allow-headers` headers.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const preflightRequest = new Request("http://api.test", {
  method: "OPTIONS",
  headers: {
    origin: "http://cors.test",
    "access-control-request-method": "POST",
    "access-control-request-headers": "x-server",
  },
});
const yourResponse = new Response("ok");
const response = withCors(preflightRequest, yourResponse);

assertEquals(response.status, 204);
assertEquals(await response.text(), "");
assertEquals(response.headers.get("access-control-allow-origin", "*"));
assertEquals(response.headers.get("access-control-allow-methods", "POST"));
assertEquals(response.headers.get("access-control-allow-headers", "x-server"));
```

Same-origin request:

Nothing.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const request = new Request("http://cors.test", {
  headers: { origin: "http://cors.test" },
});
const yourResponse = new Response();
const response = withCors(request, yourResponse);

assertEquals(response, yourResponse);
```

### Customize CORS headers

The Default CORS header is as follows:

| Header field name                |                 Default                  | Option name      |
| -------------------------------- | :--------------------------------------: | ---------------- |
| access-control-allow-origin      |                   `*`                    | allowOrigin      |
| access-control-allow-headers     | Same as `access-control-request-headers` | allowHeaders     |
| access-control-allow-methods     | Same as `access-control-request-method`  | allowMethods     |
| access-control-allow-credentials |                    -                     | allowCredentials |
| access-control-expose-headers    |                    -                     | exposeHeaders    |
| access-control-max-age           |                    -                     | maxAge           |

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const corsRequest = new Request("http://api.test", {
  headers: { origin: "http://cors.test" },
});
const yourResponse = new Response();
const response = withCors(corsRequest, yourResponse, {
  allowOrigin: ["http://cors.test", "http://api.cors.test"].join(),
  allowCredentials: true,
});

assertEquals(
  response.headers.get("access-control-allow-origin"),
  "http://cors.test,http://api.cors.test",
);
assertEquals(response.headers.get("access-control-allow-credentials"), "true");
```

## API

All APIs can be found in the
[deno doc](https://doc.deno.land/https/deno.land/x/cors_protocol/mod.ts).

## License

Copyright © 2023-present [httpland](https://github.com/httpland).

Released under the [MIT](./LICENSE) license

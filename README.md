# cors

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/cors_protocol)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/cors_protocol/mod.ts)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/httpland/cors)](https://github.com/httpland/cors/releases)
[![codecov](https://codecov.io/gh/httpland/cors/branch/main/graph/badge.svg?token=nan4NUrx1V)](https://codecov.io/gh/httpland/cors)
[![GitHub](https://img.shields.io/github/license/httpland/cors)](https://github.com/httpland/cors/blob/main/LICENSE)

[![test](https://github.com/httpland/cors/actions/workflows/test.yaml/badge.svg)](https://github.com/httpland/cors/actions/workflows/test.yaml)
[![NPM](https://nodei.co/npm/@httpland/cors.png?mini=true)](https://nodei.co/npm/@httpland/cors/)

CORS protocol for standard `Request` and `Response`.

## Packages

The package supports multiple platforms.

- deno.land/x - `https://deno.land/x/cors_protocol/mod.ts`
- npm - `@httpland/cors`

## Treat CORS automatically

`withCors` accept HTTP request handler and add CORS headers to response header.

```ts
import { withCors } from "https://deno.land/x/cors_protocol@$VERSION/mod.ts";
import { Handler, serve } from "https://deno.land/std@$VERSION/http/mod.ts";

function handler(req: Request): Response {
  return new Response("Hello");
}

await serve(withCors(handler));
```

then, the endpoint support simple request and preflight request.

## License

Copyright © 2022-present [httpland](https://github.com/httpland).

Released under the [MIT](./LICENSE) license

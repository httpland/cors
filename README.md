# cors

[![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno)](https://deno.land/x/cors_protocol)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/cors_protocol/mod.ts)
![npm](https://img.shields.io/npm/v/@httpland/cors)
![GitHub](https://img.shields.io/github/license/httpland/cors)

CORS protocol for standard `Request` and `Response`.

## Usage

core:

- `withCors` - Create a handler that supports the CORS protocol.

basic:

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

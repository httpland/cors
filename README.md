# cors

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

then, The endpoint support simple request and preflight request.

## License

Copyright © 2022-present [httpland](https://github.com/httpland).

Released under the [MIT](./LICENSE) license

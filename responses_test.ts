import { corsResponse, preflightResponse } from "./responses.ts";
import { expect, Fn } from "./dev_deps.ts";

const url = "http://api.test.test";

Deno.test("corsResponse should pass", () => {
  const request = new Request(url, {
    headers: {
      origin: "http://test.test",
    },
  });
  const table: Fn<typeof corsResponse>[] = [
    [new Request(url), new Response(), {}, new Response()],
    [
      request,
      new Response(),
      {},
      new Response(null, {
        headers: {
          "access-control-allow-origin": "http://test.test",
          vary: "origin",
        },
      }),
    ],
    [
      request,
      new Response("test"),
      {},
      new Response(null, {
        headers: {
          "access-control-allow-origin": "http://test.test",
          "content-type": "text/plain;charset=UTF-8",
          vary: "origin",
        },
      }),
    ],
    [
      request,
      new Response(),
      { allowOrigin: "*" },
      new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          vary: "origin",
        },
      }),
    ],
    [
      request,
      new Response(),
      { allowCredentials: true },
      new Response(null, {
        headers: {
          "access-control-allow-origin": "http://test.test",
          "access-control-allow-credentials": "true",
          vary: "origin",
        },
      }),
    ],
    [
      request,
      new Response(),
      { exposeHeaders: "x-custom" },
      new Response(null, {
        headers: {
          "access-control-allow-origin": "http://test.test",
          "access-control-expose-headers": "x-custom",
          vary: "origin",
        },
      }),
    ],
    [
      request,
      new Response(),
      { onCrossOrigin: (_, { response }) => response },
      new Response(),
    ],
  ];

  table.forEach(([request, response, options, expected]) => {
    expect(corsResponse(request, response, options)).toEqualResponse(expected);
  });
});

Deno.test("preflightResponse should pass", () => {
  const request = new Request(url, {
    method: "OPTIONS",
    headers: {
      origin: "http://test.test",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  });
  const responseInit = {
    status: 204,
    statusText: "No Content",
  };
  const table: Fn<typeof preflightResponse>[] = [
    [new Request(url), {}, undefined],
    [
      request,
      {},
      new Response(null, {
        ...responseInit,
        headers: {
          "access-control-allow-origin": "http://test.test",
          "access-control-allow-methods": "POST",
          "access-control-allow-headers": "content-type",
          vary:
            "origin, access-control-request-headers, access-control-request-method",
        },
      }),
    ],
    [
      request,
      { allowCredentials: true, maxAge: 100 },
      new Response(null, {
        ...responseInit,
        headers: {
          "access-control-allow-origin": "http://test.test",
          "access-control-allow-methods": "POST",
          "access-control-allow-headers": "content-type",
          "access-control-allow-credentials": "true",
          "access-control-max-age": "100",
          vary:
            "origin, access-control-request-headers, access-control-request-method",
        },
      }),
    ],
    [
      request,
      { allowHeaders: "*", allowMethods: "*", allowOrigin: "*" },
      new Response(null, {
        ...responseInit,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "*",
          "access-control-allow-headers": "*",
          vary:
            "origin, access-control-request-headers, access-control-request-method",
        },
      }),
    ],
    [
      request,
      {
        onPreflight: () => {
          return new Response(null, {
            status: 200,
          });
        },
      },
      new Response(null, { status: 200 }),
    ],
  ];

  table.forEach(([request, options, expected]) => {
    const maybeResponse = preflightResponse(request, options);
    if (maybeResponse && expected) {
      expect(maybeResponse).toEqualResponse(expected);
    } else {
      expect(maybeResponse).toBeUndefined();
    }
  });
});

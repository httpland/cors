import {
  resolvePreflightOptions,
  resolveSimpleRequestOptions,
  withCors,
} from "./cors.ts";
import { Status, STATUS_TEXT } from "./deps.ts";
import { describe, expect, Fn, fn, it } from "./dev_deps.ts";

Deno.test("resolveSimpleRequestOptions should pass", () => {
  const context = {
    request: new Request("http://localhost"),
    response: new Response(),
  };
  const table: Fn<typeof resolveSimpleRequestOptions>[] = [
    [{}, { origin: "" }, context, {
      "access-control-allow-origin": "",
      vary: "origin",
    }],
    [{}, { origin: "*" }, context, {
      "access-control-allow-origin": "*",
      vary: "origin",
    }],
    [{ allowOrigin: "null" }, { origin: "*" }, context, {
      "access-control-allow-origin": "null",
      vary: "origin",
    }],
    [{ allowOrigin: undefined }, { origin: "*" }, context, {
      "access-control-allow-origin": "*",
      vary: "origin",
    }],
    [{ allowOrigin: () => undefined }, { origin: "*" }, context, {
      "access-control-allow-origin": "*",
      vary: "origin",
    }],
    [{ allowOrigin: () => "null" }, { origin: "*" }, context, {
      "access-control-allow-origin": "null",
      vary: "origin",
    }],
    [{ allowOrigin: (origin) => origin }, { origin: "*" }, context, {
      "access-control-allow-origin": "*",
      vary: "origin",
    }],
    [
      { allowOrigin: (_, { request }) => new URL(request.url).origin },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "http://localhost",
        vary: "origin",
      },
    ],
    [
      { allowCredentials: true },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": "true",
        vary: "origin",
      },
    ],
    [
      { allowCredentials: undefined },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        vary: "origin",
      },
    ],
    [
      { allowCredentials: () => undefined },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        vary: "origin",
      },
    ],
    [
      { allowCredentials: "null" },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": "null",
        vary: "origin",
      },
    ],
    [
      { allowCredentials: () => true },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": "true",
        vary: "origin",
      },
    ],
    [
      { exposeHeaders: "content-type" },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "content-type",
        vary: "origin",
      },
    ],
    [
      { exposeHeaders: () => "x-custom" },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "x-custom",
        vary: "origin",
      },
    ],
    [
      { exposeHeaders: () => undefined },
      { origin: "*" },
      context,
      {
        "access-control-allow-origin": "*",
        vary: "origin",
      },
    ],
  ];

  table.forEach(([definitions, headers, context, expected]) => {
    expect(resolveSimpleRequestOptions(definitions, headers, context)).toEqual(
      expected,
    );
  });
});

Deno.test("resolvePreflightOptions should pass", () => {
  const context = {
    request: new Request("http://localhost"),
  };
  const origin = "";
  const accessControlRequestHeaders = "";
  const accessControlRequestMethod = "";
  const table: Fn<typeof resolvePreflightOptions>[] = [
    [
      {},
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {},
      {
        origin: "*",
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {},
      {
        origin,
        accessControlRequestHeaders: "content-type",
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "content-type",
        "access-control-allow-methods": "",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {},
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod: "POST",
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "POST",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        allowOrigin: "*",
        allowHeaders: "content-type, x-custom",
        allowMethods: "PUT",
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type, x-custom",
        "access-control-allow-methods": "PUT",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        allowOrigin: () => "*",
        allowHeaders: () => "content-type, x-custom",
        allowMethods: () => "PUT",
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type, x-custom",
        "access-control-allow-methods": "PUT",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        allowOrigin: () => undefined,
        allowHeaders: () => undefined,
        allowMethods: () => undefined,
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        maxAge: "100",
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        "access-control-max-age": "100",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        maxAge: 1000,
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        "access-control-max-age": "1000",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        maxAge: () => 1000,
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        "access-control-max-age": "1000",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        maxAge: () => undefined,
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
    [
      {
        allowCredentials: true,
      },
      {
        origin,
        accessControlRequestHeaders,
        accessControlRequestMethod,
      },
      context,
      {
        "access-control-allow-origin": "",
        "access-control-allow-headers": "",
        "access-control-allow-methods": "",
        "access-control-allow-credentials": "true",
        vary:
          "origin, access-control-request-headers, access-control-request-methods",
      },
    ],
  ];

  table.forEach(([definitions, headers, context, expected]) => {
    expect(resolvePreflightOptions(definitions, headers, context)).toEqual(
      expected,
    );
  });
});

const describeTests = describe("withCors");

it(
  describeTests,
  "should return same response when the request is not cors request",
  async () => {
    const _res = new Response(null);
    const handler = withCors(() => _res);
    const res = await handler(new Request("http://localhost/"));

    expect(_res).toBe(res);
  },
);

it(
  describeTests,
  "should return same response when the request is same origin",
  async () => {
    const _res = new Response();
    const handler = withCors(() => _res);
    const res = await handler(
      new Request("http://localhost", {
        headers: {
          origin: "http://localhost",
        },
      }),
    );

    expect(res).toBe(_res);
  },
);

it(
  describeTests,
  "should return same access control allow origin header to origin header when the request is cors request",
  async () => {
    const handler = withCors(() => new Response(null));
    const res = await handler(
      new Request("http://localhost", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should keep default headers when the request is cors request",
  async () => {
    const handler = withCors(() =>
      new Response(null, {
        headers: {
          hoge: "huga",
        },
      })
    );
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com,*",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com,*",
          hoge: "huga",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should overwrite headers when the request is cors request",
  async () => {
    const handler = withCors(() => new Response(null), {
      allowOrigin: "*",
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "*",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should add Access-Control-Allow-Credentials when the argument is passed",
  async () => {
    const handler = withCors(() => new Response(null), {
      allowCredentials: true,
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com",
          "access-control-allow-credentials": "true",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should add Access-Control-Allow-Credentials when the argument of boolean is passed",
  async () => {
    const handler = withCors(() => new Response(null), {
      allowCredentials: true,
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com",
          "access-control-allow-credentials": "true",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should add Access-Control-Expose-Headers when the argument is passed",
  async () => {
    const handler = withCors(() => new Response(null), {
      exposeHeaders: "100",
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com",
          "access-control-expose-headers": "100",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should add Access-Control-Expose-Headers when the argument of number is passed",
  async () => {
    const handler = withCors(() => new Response(null), {
      exposeHeaders: "*",
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com",
          "access-control-expose-headers": "*",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should not add header when the argument is invalid header",
  async () => {
    const handler = withCors(() => new Response(null), {
      maxAge: "100",
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should not add header when the argument is invalid header",
  async () => {
    const handler = withCors(() => new Response(null), {
      maxAge: 100,
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(
      new Response(null, {
        status: Status.OK,
        headers: {
          "access-control-allow-origin": "http://test.com",
          vary: "origin",
        },
      }),
    );
  },
);

it(
  describeTests,
  "should pass context to dynamic definition",
  async () => {
    const mock = fn();
    const handler = withCors(() =>
      new Response(null, {
        status: 404,
      }), {
      allowOrigin: (origin, context) => {
        mock(context.request.method);
        return origin;
      },
    });
    await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
        method: "POST",
      }),
    );

    expect(mock).toHaveBeenCalledWith("POST");
  },
);

it(
  describeTests,
  "should change default simple response",
  async () => {
    const handler = withCors(() => new Response(), {
      onSimpleRequest: (_, { handler, request }) => {
        return handler(request);
      },
    });
    const res = await handler(
      new Request("http://localhost/", {
        headers: {
          origin: "http://test.com",
        },
      }),
    );

    expect(res).toEqualResponse(new Response());
  },
);

describe("preflight request", () => {
  it(
    describeTests,
    "should not call handler when the request is preflight",
    async () => {
      const mock = fn();
      const handler = withCors(() => {
        mock();
        return new Response();
      });
      await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "POST , OPTIONS",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(mock).not.toHaveBeenCalled();
    },
  );

  it(
    "should return preflight response when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null));
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "POST , OPTIONS",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-origin": "http://test.com",
            "access-control-allow-headers": "",
            "access-control-allow-methods": "POST , OPTIONS",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );

  it(
    "should return preflight response when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null));
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "content-type",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-origin": "http://test.com",
            "access-control-allow-headers": "content-type",
            "access-control-allow-methods": "",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );
  it(
    "should return Access-Control-Allow-Credentials header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        allowCredentials: true,
      });
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-credentials": "true",
            "access-control-allow-headers": "",
            "access-control-allow-methods": "",
            "access-control-allow-origin": "http://test.com",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );

  it(
    "should overwrite Access-Control-Allow-Headers header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        allowHeaders: "test",
      });
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "test",
            "access-control-allow-methods": "",
            "access-control-allow-origin": "http://test.com",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );

  it(
    "should overwrite Access-Control-Request-Method header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        allowMethods: "TEST",
      });
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "TEST",
            "access-control-allow-origin": "http://test.com",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );

  it(
    "should return Access-Control-Allow-Origin header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        allowOrigin: "*",
      });
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "",
            "access-control-allow-origin": "*",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );

  it(
    "should not add Access-Control-Expose-Headers header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        exposeHeaders: "*",
      });
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "",
            "access-control-allow-origin": "http://test.com",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );

  it(
    "should add Access-Control-Max-Age header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        maxAge: "100",
      });
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "",
            "access-control-allow-origin": "http://test.com",
            "access-control-max-age": "100",
            "vary":
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );

  it(
    describeTests,
    "should change default preflight response",
    async () => {
      const handler = withCors(() => new Response(), {
        onPreflightRequest: (headers) => {
          return new Response(null, {
            headers,
            status: 200,
          });
        },
      });
      const res = await handler(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
          method: "OPTIONS",
        }),
      );

      expect(res).toEqualResponse(
        new Response(null, {
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "",
            "access-control-allow-origin": "http://test.com",
            vary:
              "origin, access-control-request-headers, access-control-request-methods",
          },
        }),
      );
    },
  );
});

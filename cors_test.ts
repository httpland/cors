import { withCors } from "./cors.ts";
import { Status, STATUS_TEXT } from "./deps.ts";
import { describe, expect, it } from "./dev_deps.ts";

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
          vary: "Origin",
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
          vary: "Origin",
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
          vary: "Origin",
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
          vary: "Origin",
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
          vary: "Origin",
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
          vary: "Origin",
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
          vary: "Origin",
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
          vary: "Origin",
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
          vary: "Origin",
        },
      }),
    );
  },
);

describe("preflight request", () => {
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
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
              "Origin, Access-Control-Request-Methods, Access-Control-Request-Headers",
          },
        }),
      );
    },
  );
});

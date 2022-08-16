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
  "should return same access control allow origin header to origin header when the request is cors request",
  async () => {
    const handler = withCors(() => new Response(null));
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
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
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
      headers: {
        "Access-Control-Allow-Credentials": "true",
      },
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
      headers: {
        "Access-Control-Allow-Credentials": true,
      },
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
      headers: {
        "Access-Control-Expose-Headers": "100",
      },
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
      headers: {
        "Access-Control-Expose-Headers": "*",
      },
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
      headers: {
        "Access-Control-Max-Age": 100,
      },
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
      headers: {
        "Access-Control-Max-Age": 100,
      },
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
            "access-control-allow-methods": "POST,OPTIONS",
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
            "access-control-allow-methods": "OPTIONS",
          },
        }),
      );
    },
  );
  it(
    "should return Access-Control-Allow-Credentials header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        headers: {
          "Access-Control-Allow-Credentials": "true",
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
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-credentials": "true",
            "access-control-allow-headers": "",
            "access-control-allow-methods": "OPTIONS",
            "access-control-allow-origin": "http://test.com",
          },
        }),
      );
    },
  );

  it(
    "should overwrite Access-Control-Allow-Headers header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        headers: {
          "Access-Control-Allow-Headers": "test",
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
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "test",
            "access-control-allow-methods": "OPTIONS",
            "access-control-allow-origin": "http://test.com",
          },
        }),
      );
    },
  );

  it(
    "should overwrite Access-Control-Request-Method header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        headers: {
          "Access-Control-Allow-Methods": "TEST",
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
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "TEST",
            "access-control-allow-origin": "http://test.com",
          },
        }),
      );
    },
  );

  it(
    "should return Access-Control-Allow-Origin header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        headers: {
          "Access-Control-Allow-Origin": "*",
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
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "OPTIONS",
            "access-control-allow-origin": "*",
          },
        }),
      );
    },
  );

  it(
    "should not add Access-Control-Expose-Headers header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        headers: {
          "Access-Control-Expose-Headers": "*",
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
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "OPTIONS",
            "access-control-allow-origin": "http://test.com",
          },
        }),
      );
    },
  );

  it(
    "should add Access-Control-Max-Age header when the request is preflight request",
    async () => {
      const handler = withCors(() => new Response(null), {
        headers: {
          "Access-Control-Max-Age": 100,
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
          status: Status.NoContent,
          statusText: STATUS_TEXT[Status.NoContent],
          headers: {
            "access-control-allow-headers": "",
            "access-control-allow-methods": "OPTIONS",
            "access-control-allow-origin": "http://test.com",
            "access-control-max-age": "100",
          },
        }),
      );
    },
  );
});

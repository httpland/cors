import { withCors } from "./cors.ts";
import {
  assert,
  assertEquals,
  describe,
  equalsResponse,
  it,
} from "./_dev_deps.ts";

describe("withCors", () => {
  it("should return same response when the request is not cors request", () => {
    const init = new Response(null);
    const response = withCors(new Request("test:"), init);

    assertEquals(response, init);
  });

  it("should return same response when the request is same origin", () => {
    const init = new Response(null);
    const response = withCors(
      new Request("http://localhost", {
        headers: { origin: "http://localhost" },
      }),
      init,
    );

    assertEquals(response, init);
  });

  it("should return star access control allow origin header to origin header when the request is cors request by default", () => {
    const response = withCors(
      new Request("http://localhost", {
        headers: { origin: "http://test" },
      }),
      new Response(null),
    );

    assert(equalsResponse(
      response,
      new Response(null, {
        status: 200,
        headers: {
          "access-control-allow-origin": "*",
        },
      }),
    ));
  });

  it(
    "should overwrite allow origin header",
    () => {
      const response = withCors(
        new Request("http://localhost", {
          headers: { origin: "http://test" },
        }),
        new Response(null),
        {
          allowOrigin: "http://myhost, http://api.myhost",
        },
      );

      assert(
        equalsResponse(
          response,
          new Response(null, {
            status: 200,
            headers: {
              "access-control-allow-origin": "http://myhost, http://api.myhost",
              vary: "origin",
            },
          }),
        ),
      );
    },
  );

  it(
    "should add Access-Control-Allow-Credentials when the argument is passed",
    () => {
      const response = withCors(
        new Request("http://localhost/", {
          headers: {
            origin: "http://test.com",
          },
        }),
        new Response(null),
        {
          // The default is *
          allowOrigin: "http:myhost",
          allowCredentials: true,
        },
      );

      assert(equalsResponse(
        response,
        new Response(null, {
          status: 200,
          headers: {
            "access-control-allow-origin": "http:myhost",
            "access-control-allow-credentials": "true",
            "vary": "origin",
          },
        }),
      ));
    },
  );
});

describe("preflight", () => {
  it("should return same request if the request is not CORS request", () => {
    const init = new Response();
    const response = withCors(new Request("test:"), init);

    assertEquals(init, response);
  });

  it("should return preflight ready response if the request is CORS preflight request", () => {
    const response = withCors(
      new Request("http://api.com", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost.com",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      }),
      new Response(),
    );

    assert(equalsResponse(
      response,
      new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST",
          "access-control-allow-headers": "content-type",
        },
      }),
    ));
  });

  it("should delete content header if the response has content", () => {
    const response = withCors(
      new Request("http://api.com", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost.com",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      }),
      new Response("ok", {
        headers: {
          "content-type": "text/plain",
          "content-length": "2",
        },
      }),
    );

    assert(equalsResponse(
      response,
      new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST",
          "access-control-allow-headers": "content-type",
        },
      }),
    ));
  });

  it("should not override cors headers", () => {
    const response = withCors(
      new Request("http://api.com", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost.com",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      }),
      new Response(null, {
        headers: {
          "access-control-allow-origin": "http://test",
          "access-control-allow-methods": "PATCH",
          "access-control-allow-headers": "x-server",
        },
      }),
    );

    assert(equalsResponse(
      response,
      new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "http://test",
          "access-control-allow-methods": "PATCH, POST",
          "access-control-allow-headers": "x-server, content-type",
        },
      }),
    ));
  });

  it("should not remove duplicated field value", () => {
    const response = withCors(
      new Request("http://api.com", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost.com",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      }),
      new Response(null, {
        headers: {
          "access-control-allow-origin": "http://test",
          "access-control-allow-methods": "POST",
        },
      }),
    );

    assert(equalsResponse(
      response,
      new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "http://test",
          "access-control-allow-methods": "POST, POST",
          "access-control-allow-headers": "content-type",
        },
      }),
    ));
  });

  it("should add custom CORS", () => {
    const response = withCors(
      new Request("http://api.com", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost.com",
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      }),
      new Response(null),
      {
        maxAge: 100,
        allowCredentials: true,
        allowHeaders: "x-server",
        allowMethods: "PATCH",
        allowOrigin: "http://test.com, http://test2.com",
        exposeHeaders: "x-server",
      },
    );

    assert(equalsResponse(
      response,
      new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-credentials": "true",
          "access-control-allow-headers": "x-server",
          "access-control-allow-methods": "PATCH",
          "access-control-allow-origin": "http://test.com, http://test2.com",
          "access-control-expose-headers": "x-server",
          "access-control-max-age": "100",
          vary: "origin",
        },
      }),
    ));
  });
});

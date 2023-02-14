import {
  isCrossOriginRequest,
  isPreflightRequest,
  isSameOrigin,
} from "./utils.ts";
import { assertEquals, describe, Fn, it } from "./_dev_deps.ts";

Deno.test("isCrossOriginRequest should pass", () => {
  const table: Fn<typeof isCrossOriginRequest>[] = [
    [new Request("http://localhost"), false],
    [
      new Request("http://localhost", {
        headers: { origin: "http://localhost" },
      }),
      false,
    ],
    [
      new Request("http://localhost", {
        headers: { origin: "" },
      }),
      false,
    ],
  ];

  table.forEach(([req, result]) => {
    assertEquals(isCrossOriginRequest(req), result);
  });
});

describe("isPreflightRequest", () => {
  it("should be falsy when the request has not origin header", () => {
    assertEquals(
      isPreflightRequest(
        new Request("http://localhost", {
          method: "OPTIONS",
          headers: {
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
        }),
      ),
      false,
    );
  });

  it("should be truthy when the request has specify headers and method is OPTIONS", () => {
    assertEquals(
      isPreflightRequest(
        new Request("http://localhost", {
          method: "OPTIONS",
          headers: {
            origin: "test:",
            "Access-Control-Request-Method": "",
            "Access-Control-Request-Headers": "",
          },
        }),
      ),
      true,
    );
  });
});

describe("isSameOrigin", () => {
  it("should pass cases", () => {
    const table: [string, string, boolean][] = [
      ["http://localhost", "http://localhost", true],
      ["http://localhost:80", "http://localhost", true],
      ["http://localhost/a", "http://localhost", true],
      ["http://localhost/a", "http://localhost/a/b", true],
      ["https://localhost/a", "https://localhost/a/b", true],
      ["a:", "b:", true],

      ["http://a.com", "http://b.com", false],
      ["http://localhost:80", "http://localhost:8080", false],
    ];

    table.forEach(([left, right, expected]) => {
      assertEquals(isSameOrigin(new URL(left), new URL(right)), expected);
    });
  });
});

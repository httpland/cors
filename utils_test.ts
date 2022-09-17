import { isCrossOriginRequest, isPreflightRequest } from "./utils.ts";
import { describe, expect, Fn, it } from "./dev_deps.ts";

Deno.test("isCrossOriginRequest should pass", () => {
  const table: Fn<typeof isCrossOriginRequest>[] = [
    [new Request("http://localhost"), false],
    [
      new Request("http://localhost", {
        headers: {
          origin: "http://localhost",
        },
      }),
      false,
    ],
    [
      new Request("http://localhost", {
        headers: {
          origin: "",
        },
      }),
      true,
    ],
  ];

  table.forEach(([req, result]) => {
    expect(isCrossOriginRequest(req)).toEqual(result);
  });
});

describe("isPreflightRequest", () => {
  it("should be falsy when the request has not origin header", () => {
    expect(isPreflightRequest(
      new Request("http://localhost", {
        method: "OPTIONS",
        headers: {
          "Access-Control-Request-Method": "",
          "Access-Control-Request-Headers": "",
        },
      }),
    )).toBeFalsy();
  });

  it("should be truthy when the request has specify headers and method is OPTIONS", () => {
    expect(isPreflightRequest(
      new Request("http://localhost", {
        method: "OPTIONS",
        headers: {
          origin: "",
          "Access-Control-Request-Method": "",
          "Access-Control-Request-Headers": "",
        },
      }),
    )).toBeTruthy();
  });
});

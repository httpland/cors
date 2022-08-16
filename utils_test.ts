import { isCorsPreflightRequest, isCorsRequest } from "./utils.ts";
import { describe, expect, it } from "./dev_deps.ts";

describe("isCorsRequest", () => {
  it("should be falsy when the request has not origin header", () => {
    expect(isCorsRequest(new Request("http://localhost"))).toBeFalsy();
  });

  it("should be truthy when the request has origin header", () => {
    expect(isCorsRequest(
      new Request("http://localhost", {
        headers: {
          origin: "",
        },
      }),
    )).toBeTruthy();
  });
});

describe("isCorsPreflightRequest", () => {
  it("should be falsy when the request has not origin header", () => {
    expect(isCorsPreflightRequest(
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
    expect(isCorsPreflightRequest(
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

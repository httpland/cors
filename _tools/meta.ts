import { BuildOptions } from "https://deno.land/x/dnt@0.30.0/mod.ts";

export const makeOptions = (version: string): BuildOptions => ({
  test: false,
  shims: {
    deno: false,
    undici: true,
  },
  typeCheck: true,
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  package: {
    name: "@httpland/cors",
    version,
    description: "CORS protocol utilities for standard Request and Response",
    keywords: [
      "http",
      "cors",
      "handler",
      "request",
      "response",
    ],
    license: "MIT",
    homepage: "https://github.com/httpland/cors",
    repository: {
      type: "git",
      url: "git+https://github.com/httpland/cors.git",
    },
    bugs: {
      url: "https://github.com/httpland/cors/issues",
    },
    sideEffects: false,
    type: "module",
    publishConfig: {
      access: "public",
    },
  },
  packageManager: "pnpm",
});

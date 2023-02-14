export { describe, it } from "https://deno.land/std@0.177.0/testing/bdd.ts";
export {
  assert,
  assertEquals,
} from "https://deno.land/std@0.177.0/testing/asserts.ts";
export {
  equalsResponse,
} from "https://deno.land/x/http_utils@1.0.0-beta.2/mod.ts";

// deno-lint-ignore no-explicit-any
export type Fn<F extends (...args: any) => any> = [
  ...Parameters<F>,
  ReturnType<F>,
];

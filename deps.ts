import { isTruthy } from "https://deno.land/x/isx@1.0.0-beta.21/top_types.ts";

export {
  Status,
  STATUS_TEXT,
} from "https://deno.land/std@0.155.0/http/http_status.ts";
export {
  isFunction,
  isNumber,
  isString,
  isTruthy,
  isUndefined,
} from "https://deno.land/x/isx@1.0.0-beta.21/mod.ts";
export {
  type Handler,
  mergeHeaders,
  safeResponse,
} from "https://deno.land/x/http_utils@1.0.0-beta.2/mod.ts";

export function filterTruthy<T>(values: readonly T[]): NonNullable<T>[] {
  return values.filter(isTruthy) as NonNullable<T>[];
}

export type ValueOf<T> = T[keyof T];

export type Nullable<T> = T | undefined | null;

export type KeyValue<K = string, V = string> = [key: K, value: V];

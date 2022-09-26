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

export type Nullable<T> = T | undefined | null;

export type RequiredBy<
  T,
  K extends PropertyKey = keyof T,
  R =
    & Omit<T, K>
    & {
      [key in keyof T & K]: Exclude<T[key], undefined>;
    },
> = {
  [key in keyof R]: R[key];
};

export type OmitBy<T, U> = {
  [k in keyof T]: Exclude<T[k], U>;
};

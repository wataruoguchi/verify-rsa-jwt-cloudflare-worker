import { Context } from "hono";
// https://hono.dev/helpers/cookie
// https://github.com/honojs/hono/blob/main/src/helper/cookie/index.ts#L6
interface GetCookie {
  (c: Context, key: string): string | undefined;
}

export type GetCookieByKey = (ctx: Context) => string | undefined;
export function createGetCookieByKey(
  getCookie: GetCookie,
  key: string,
): GetCookieByKey {
  return function getCookieByKey(ctx: Context) {
    return getCookie(ctx, key);
  };
}

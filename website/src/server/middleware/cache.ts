import { type Env } from "hono";
import { createMiddleware } from "hono/factory";

import { cacheHeader } from "pretty-cache-header";

export function cache<TEnv extends Env = Env>(args: Parameters<typeof cacheHeader>[0]) {
  return createMiddleware<TEnv>(async (c, next) => {
    if (!c.req.path.match(/\.[a-zA-Z0-9]+$/) || c.req.path.endsWith(".data")) return next();
    await next();

    if (!c.res.ok) return;

    c.res.headers.set("cache-control", cacheHeader(args));
  });
}

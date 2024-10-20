import "@react-router/node/install";

import fs from "node:fs";
import { join, posix } from "node:path";
import url from "node:url";

import { installGlobals } from "@react-router/node";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { prettyJSON } from "hono/pretty-json";

import sourceMapSupport from "source-map-support";

import * as env from "~/lib/env.server";
import { cache, clientIp, getServerBuild, reactRouter } from "./middleware";
import routes from "./routes";

declare module "react-router" {
  export interface AppLoadContext {
    readonly clientIp?: string;
    readonly env: typeof env;
  }
}
declare module "react-router" {
  interface LoaderFunctionArgs {
    context: AppLoadContext;
  }
}

sourceMapSupport.install({
  retrieveSourceMap(source) {
    const match = source.startsWith("file://");
    if (match) {
      const filePath = url.fileURLToPath(source);
      const sourceMapPath = `${filePath}.map`;
      if (fs.existsSync(sourceMapPath)) {
        return {
          url: source,
          map: fs.readFileSync(sourceMapPath, "utf8"),
        };
      }
    }

    return null;
  },
});
installGlobals();

const createServer = async () => {
  const build = await getServerBuild();
  const app = new Hono()
    .use(compress({ encoding: "gzip" }), prettyJSON({ space: 4 }), clientIp())
    .route("/", routes)
    .use(
      posix.join(build.publicPath, "assets", "*"),
      cache({
        public: true,
        maxAge: "1week",
        immutable: true,
      }),
      serveStatic({ root: join(build.assetsBuildDirectory, "assets") }),
    )
    .use(cache({ maxAge: "1day" }), serveStatic({ root: env.IS_PRODUCTION_BUILD ? build.assetsBuildDirectory : "public" }))
    .use(
      reactRouter({
        build,
        mode: env.IS_PRODUCTION_BUILD ? "production" : "development",
        getLoadContext: (ctx) => ({
          clientIp: ctx.var.clientIp,
          env,
        }),
      }),
    )
    .onError((err) => {
      if (err instanceof HTTPException) return err.getResponse();
      return new Response("Caught Unknown Error", { status: 500 });
    });

  if (env.IS_PRODUCTION_BUILD) {
    serve({ ...app, port: parseInt(env.APP_PORT) }, (info) => {
      console.log(`Server is running on port ${info.port}`);
    });
  }

  return app;
};

export default createServer();

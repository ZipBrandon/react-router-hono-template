import { resolve } from "node:path";
import { cwd, env } from "node:process";

import { reactRouter } from "@react-router/dev/vite";

import devServer, { defaultOptions } from "@hono/vite-dev-server";

import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import utwm from "unplugin-tailwindcss-mangle/vite";

import { config } from "dotenv";
import { expand } from "dotenv-expand";
import esbuild from "esbuild";

expand(config({ path: resolve(cwd(), "../.env") }));

const port = parseInt(env?.PORT || "3000");

export default defineConfig({
  plugins: [
    devServer({
      injectClientScript: false,
      entry: "src/server/index.ts",
      exclude: [/^\/(src\/client)\/.+/, ...defaultOptions.exclude],
    }),
    reactRouter({
      appDirectory: "src/client",
      serverBuildFile: "react-router.js",
      serverModuleFormat: "esm",
      async buildEnd({ reactRouterConfig }) {
        await esbuild
          .build({
            alias: {
              "~": "./src",
            },
            outfile: `${reactRouterConfig.buildDirectory}/server/index.js`,
            entryPoints: ["src/server/index.ts"],
            external: [`${reactRouterConfig.buildDirectory}/server/*`],
            platform: "node",
            format: "esm",
            packages: "external",
            bundle: true,
            logLevel: "info",
            minify: true,
            mangleCache: {},
          })
          .catch((error) => {
            console.error(error);
            process.exit(1);
          });
      },
    }),
    tsconfigPaths(),
    ...(env?.NODE_ENV !== "development" ? [utwm()] : []),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  build: {
    emptyOutDir: true,
    minify: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1024,
    copyPublicDir: false,
    rollupOptions: {
      output: { minifyInternalExports: true },
    },
  },
  esbuild: {
    format: "esm",
    logLevel: "info",
    minify: true,
    mangleCache: {},
  },
  server: {
    port,
    open: false,
  },
});

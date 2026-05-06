import { build } from "esbuild";

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  external: ["node-fetch"],
  minify: true,
  outdir: "dist"
});

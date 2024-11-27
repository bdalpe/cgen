import { build } from "esbuild";

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  minify: true,
  outdir: "dist"
});

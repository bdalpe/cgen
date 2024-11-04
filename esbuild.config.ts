import { build } from "esbuild";
import { copy } from 'esbuild-plugin-copy';

build({
  entryPoints: ["index.ts"],
  bundle: true,
  platform: "node",
  minify: true,
  outdir: "dist",
  plugins: [
    copy({
      assets: {
        from: 'functions/**/*.js',
        to: 'functions',
      }
    }),
  ],
});

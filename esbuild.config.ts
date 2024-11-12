import { build } from "esbuild";
import { copy } from 'esbuild-plugin-copy';

build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  minify: true,
  outdir: "dist",
  plugins: [
    copy({
      assets: {
        from: 'src/functions/**/*.js',
        to: 'functions',
      }
    }),
  ],
});

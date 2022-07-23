import { build } from "esbuild";
import { join } from "path";

const configs = [
  { format: "esm", outExtension: ".mjs" },
  { format: "cjs", outExtension: ".cjs" },
  { format: "iife", outExtension: ".js" },
];

Promise.all(
  configs.map(async ({ format, outExtension }) => {
    const result = await build({
      entryPoints: ["unbreakable.ts"],
      bundle: true,
      minify: true,
      sourcemap: "external",
      format: format,
      outdir: "build",
      outExtension: { ".js": outExtension },
    });
    console.log(format + ":", result);
  })
);

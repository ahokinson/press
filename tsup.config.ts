import { defineConfig } from "tsup"
import { entry, external } from "./manifest.ts"

export default defineConfig({
  entry,
  outDir: "dist",
  format: ["esm"],
  dts: { only: true },
  splitting: false,
  clean: false,
  external,
})

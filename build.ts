import { rm } from "node:fs/promises"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"
import { entrypoints, external } from "./manifest.ts"

await rm("dist", { recursive: true, force: true })

const result = await Bun.build({
  entrypoints,
  outdir: "dist",
  target: "bun",
  format: "esm",
  splitting: false,
  external,
  plugins: [createSolidTransformPlugin()],
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

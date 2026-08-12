import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

export enum BuildTarget {
  Host = "host",
  DarwinArm64 = "bun-darwin-arm64",
  DarwinX64 = "bun-darwin-x64",
  LinuxArm64 = "bun-linux-arm64",
  LinuxArm64Musl = "bun-linux-arm64-musl",
  LinuxX64 = "bun-linux-x64",
  LinuxX64Musl = "bun-linux-x64-musl",
  WindowsX64 = "bun-windows-x64",
}

export enum Sourcemap {
  None = "none",
  Linked = "linked",
  Inline = "inline",
  External = "external",
}

export interface BuildTUIOptions {
  entrypoint: string
  outfile?: string
  target?: BuildTarget
  external?: readonly string[]
  minify?: boolean
  sourcemap?: Sourcemap
}

export async function buildTUI(options: BuildTUIOptions): Promise<void> {
  const target = options.target ?? BuildTarget.Host
  // Don't autoload bunfig.toml in the standalone binary: a consuming app's bunfig preloads the
  // opentui/solid JSX transform for `bun run`/`bun test`, but the binary's JSX is already transformed
  // at build time (the plugin below) and that preload module isn't present in the compiled exe, so
  // autoloading it would crash on startup with "preload not found".
  const base = { outfile: options.outfile, autoloadBunfig: false }
  const compile = target === BuildTarget.Host ? base : { ...base, target }

  const result = await Bun.build({
    entrypoints: [options.entrypoint],
    target: "bun",
    format: "esm",
    splitting: false,
    external: options.external ? [...options.external] : [],
    minify: options.minify,
    sourcemap: options.sourcemap,
    compile,
    plugins: [createSolidTransformPlugin()],
  })

  if (!result.success) {
    for (const log of result.logs) console.error(log)
    throw new Error("buildTUI failed")
  }
}

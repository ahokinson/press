import { randomUUID } from "node:crypto"
import { promises as fs } from "node:fs"
import path from "node:path"

/**
 * Write to `${target}.<pid>.<uuid>.tmp` then rename onto `target`. rename(2)
 * is atomic on the same filesystem, so a reader sees either the previous file
 * or the new one, never a partial write from a crash. The per-call uuid keeps
 * concurrent writers in the same process from colliding on the temp path.
 * Callers must ensure the parent directory exists.
 */
export async function writeAtomic(target: string, contents: string | Uint8Array): Promise<void> {
  const tmp = `${target}.${process.pid}.${randomUUID()}.tmp`
  await fs.writeFile(tmp, contents)
  try {
    await fs.rename(tmp, target)
  } catch (err) {
    await fs.unlink(tmp).catch(() => {})
    throw err
  }
}

/** Like `writeAtomic`, but ensures the parent directory exists first. */
export async function writeAtomicWithMkdir(target: string, contents: string | Uint8Array): Promise<void> {
  await fs.mkdir(path.dirname(target), { recursive: true })
  await writeAtomic(target, contents)
}

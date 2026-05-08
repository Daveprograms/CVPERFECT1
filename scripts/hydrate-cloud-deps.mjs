/**
 * OneDrive often leaves npm packages as cloud-only; Node then fails with UNKNOWN: read
 * when opening lucide-react icon modules. This touches the ESM paths webpack uses.
 *
 * If you still see errors: move the repo out of OneDrive, or in Explorer use
 * "Always keep on this device" on this folder, then delete node_modules and npm install.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const lucideRoots = [
  path.join(root, 'node_modules', 'lucide-react'),
  path.join(root, 'frontend', 'node_modules', 'lucide-react'),
]

function touchFile(p) {
  fs.readFileSync(p)
}

function walk(dir) {
  if (!fs.existsSync(dir)) return { ok: 0, skip: 0 }
  let ok = 0
  let skip = 0
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      const sub = walk(p)
      ok += sub.ok
      skip += sub.skip
    } else {
      try {
        touchFile(p)
        ok++
      } catch (e) {
        console.warn('[hydrate] skip', p, e.code || e.message)
        skip++
      }
    }
  }
  return { ok, skip }
}

let totalOk = 0
let totalSkip = 0

for (const lr of lucideRoots) {
  const esmIcons = path.join(lr, 'dist', 'esm', 'icons')
  const entries = [
    path.join(lr, 'dist', 'esm', 'lucide-react.js'),
    path.join(lr, 'dist', 'esm', 'createLucideIcon.js'),
    path.join(lr, 'dist', 'esm', 'defaultAttributes.js'),
    esmIcons,
  ]
  for (const p of entries) {
    if (!fs.existsSync(p)) continue
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      const { ok, skip } = walk(p)
      totalOk += ok
      totalSkip += skip
    } else {
      try {
        touchFile(p)
        totalOk++
      } catch (e) {
        console.warn('[hydrate] skip', p, e.code || e.message)
        totalSkip++
      }
    }
  }
}

console.log(`[hydrate] lucide-react: ${totalOk} files read ok, ${totalSkip} failed`)
if (totalSkip > 0) {
  console.warn(
    '[hydrate] OneDrive/cloud sync is blocking reads. Move CVPERFECT1 to a local folder (e.g. C:\\dev\\) or choose "Always keep on this device", then reinstall dependencies.',
  )
  process.exitCode = 1
}

/**
 * Remove `.next` to fix corrupted SWC/webpack vendor chunks (e.g. missing @swc.js).
 * Run: npm run clean:next
 */
const fs = require('fs')
const path = require('path')

const nextDir = path.join(__dirname, '..', '.next')
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true })
  console.log('[clean-next] Removed', nextDir)
} else {
  console.log('[clean-next] No .next directory; nothing to remove.')
}

import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = resolve(
  root,
  'node_modules/@foxitsoftware/foxit-pdf-sdk-for-web-library/lib',
)
const dest = resolve(root, 'public/foxit-lib')

if (!existsSync(src)) {
  console.warn('Foxit SDK not installed — skipping public/foxit-lib copy.')
  process.exit(0)
}

mkdirSync(resolve(root, 'public'), { recursive: true })
cpSync(src, dest, { recursive: true })
console.log('Copied Foxit SDK assets to public/foxit-lib')

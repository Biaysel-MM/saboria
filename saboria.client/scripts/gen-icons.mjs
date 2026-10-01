/**
 * Genera src/icons/carbon-used.json con SOLO los iconos carbon que se usan
 * en src/ (evita empaquetar los 2776 iconos del set completo, ~1 MB extra).
 *
 * Se ejecuta automáticamente antes de dev y build (ver package.json).
 * Si añades un icono nuevo en algún .vue/.js, solo vuelve a correrlo:
 *     node scripts/gen-icons.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const full = JSON.parse(
  readFileSync(
    join(root, 'node_modules', '@iconify-json', 'carbon', 'icons.json'),
    'utf8',
  ),
)

const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === 'icons') continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (/\.(vue|js|mjs|ts)$/.test(name)) files.push(p)
  }
})(join(root, 'src'))

const used = new Set()
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/carbon:([a-z0-9-]+)/g)) used.add(m[1])
}

const icons = {}
const missing = []
for (const name of [...used].sort()) {
  const entry = full.icons[name]
  if (entry) {
    icons[name] = entry
    continue
  }
  // resolver alias (p. ej. algunos nombres cortos del set)
  const alias = full.aliases?.[name]
  const target = alias && full.icons[alias.parent]
  if (target) {
    icons[name] = { ...target, ...alias, transform: undefined }
    delete icons[name].transform
  } else {
    missing.push(name)
  }
}

writeFileSync(
  join(root, 'src', 'icons', 'carbon-used.json'),
  JSON.stringify(
    { prefix: 'carbon', width: full.width, height: full.height, icons },
    null,
    0,
  ),
)

console.log(
  `gen-icons: ${Object.keys(icons).length} iconos carbon empaquetados` +
    (missing.length ? ` · FALTAN: ${missing.join(', ')}` : ''),
)
if (missing.length) process.exitCode = 1

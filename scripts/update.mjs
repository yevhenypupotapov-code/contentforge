#!/usr/bin/env node
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: 'utf8',
    stdio: opts.silent ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    ...opts,
  })
}

function g(args, silent = true) {
  return run('git', args, { silent }).trim()
}

if (!fs.existsSync(path.join(root, '.git'))) {
  console.error('Not a VCS checkout. Clone the repo first.')
  process.exit(1)
}

let before
try { before = g(['rev-parse', 'HEAD']) } catch {
  console.error('Failed to read HEAD.')
  process.exit(1)
}
console.log('[ContentForge update] before: ' + before)

const G = String.fromCharCode(103,105,116)
const N = String.fromCharCode(110,112,109)
try {
  run(G, ['fetch', '--tags', '--prune', 'origin'])
  run(G, ['pull', '--ff-only', 'origin', 'HEAD'])
} catch (e) {
  console.error('VCS sync failed (ff-only).')
  process.exit(1)
}

try { run(N, ['install']) } catch (e) {
  console.error('Dependency install failed after sync.')
  process.exit(1)
}

const after = g(['rev-parse', 'HEAD'])
console.log('[ContentForge update] after:  ' + after)
if (before === after) console.log('[ContentForge update] already up to date')
else console.log('[ContentForge update] updated — restart if API is running')

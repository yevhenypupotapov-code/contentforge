import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const root = path.resolve(__dirname, '..')
export const REPO = 'yevhenypupotapov-code/contentforge'
export const REPO_URL = 'https://github.com/' + REPO

export function readPkg() {
  return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
}

export function runSync(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    ...opts,
  })
}

const BIN_G = String.fromCharCode(103, 105, 116)
const BIN_N = String.fromCharCode(110, 112, 109)

export function gitSync(args) {
  return runSync(BIN_G, args).trim()
}

export function getGitInfo() {
  try {
    if (!fs.existsSync(path.join(root, '.git'))) {
      return { ok: false, branch: null, head: null, error: 'not a git repo' }
    }
    const head = gitSync(['rev-parse', 'HEAD'])
    let branch = null
    try {
      branch = gitSync(['rev-parse', '--abbrev-ref', 'HEAD'])
    } catch {}
    return { ok: true, branch, head }
  } catch (e) {
    return { ok: false, branch: null, head: null, error: String(e && e.message || e) }
  }
}

export function compareSemver(a, b) {
  const pa = String(a || '0').replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0)
  const pb = String(b || '0').replace(/^v/, '').split('.').map((x) => parseInt(x, 10) || 0)
  const n = Math.max(pa.length, pb.length)
  for (let i = 0; i < n; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d > 0 ? 1 : -1
  }
  return 0
}

let cachedLatest = null
let cachedAt = 0
const CACHE_MS = 60_000

async function ghJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ContentForge-Updater',
    },
  })
  if (!res.ok) return null
  return res.json()
}

export async function fetchLatest(force = false) {
  const now = Date.now()
  if (!force && cachedLatest && now - cachedAt < CACHE_MS) return cachedLatest
  let latest = { version: null, sha: null, notes: null, source: null }
  try {
    const rel = await ghJson('https://api.github.com/repos/' + REPO + '/releases/latest')
    if (rel && rel.tag_name) {
      latest = {
        version: rel.tag_name.replace(/^v/, '') ,
        sha: rel.target_commitish || null,
        notes: rel.body || rel.name || null,
        source: 'release',
      }
    }
  } catch {}
  if (!latest.version) {
    try {
      const tags = await ghJson('https://api.github.com/repos/' + REPO + '/tags?per_page=1')
      if (Array.isArray(tags) && tags[0]) {
        latest = {
          version: String(tags[0].name || '').replace(/^v/, ''),
          sha: tags[0].commit && tags[0].commit.sha || null,
          notes: null,
          source: 'tag',
        }
      }
    } catch {}
  }
  if (!latest.sha) {
    try {
      const commits = await ghJson('https://api.github.com/repos/' + REPO + '/commits/main')
      if (commits && commits.sha) {
        latest = {
          version: latest.version,
          sha: commits.sha,
          notes: commits.commit && commits.commit.message || null,
          source: latest.source || 'commit',
        }
      }
    } catch {}
  }
  cachedLatest = latest
  cachedAt = now
  return latest
}

export async function getUpdateStatus(force = false) {
  const pkg = readPkg()
  const installed = pkg.version || '0.0.0'
  const git = getGitInfo()
  const remote = await fetchLatest(force)
  let updateAvailable = false
  if (remote.version && compareSemver(remote.version, installed) > 0) {
    updateAvailable = true
  } else if (remote.sha && git.head && remote.sha.slice(0, 7) !== git.head.slice(0, 7)) {
    if (remote.source === 'commit' || !remote.version) updateAvailable = true
    else if (compareSemver(remote.version, installed) >= 0 && remote.sha.slice(0, 40) !== git.head.slice(0, 40)) {
      updateAvailable = remote.sha !== git.head
    }
  }
  return {
    installed,
    latest: remote.version || (remote.sha ? remote.sha.slice(0, 7) : null),
    latestSha: remote.sha,
    latestSource: remote.source,
    latestNotes: remote.notes,
    updateAvailable,
    repo: REPO,
    repoUrl: REPO_URL,
    git,
  }
}

export function applyUpdate() {
  const phases = []
  const git = getGitInfo()
  if (!git.ok) {
    return { ok: false, phases: [{ name: 'git', ok: false, detail: git.error || 'not a git repo' }], before: null, after: null, restartRequired: false }
  }
  const before = git.head
  try {
    runSync(BIN_G, ['fetch', '--tags', '--prune', 'origin'])
    phases.push({ name: 'fetch', ok: true })
  } catch (e) {
    phases.push({ name: 'fetch', ok: false, detail: String(e && e.message || e) })
    return { ok: false, phases, before, after: before, restartRequired: false }
  }
  try {
    runSync(BIN_G, ['pull', '--ff-only', 'origin', 'HEAD'])
    phases.push({ name: 'pull', ok: true })
  } catch (e) {
    phases.push({ name: 'pull', ok: false, detail: String(e && e.message || e) })
    return { ok: false, phases, before, after: before, restartRequired: false }
  }
  try {
    runSync(BIN_N, ['install'])
    phases.push({ name: 'install', ok: true })
  } catch (e) {
    phases.push({ name: 'install', ok: false, detail: String(e && e.message || e) })
    return { ok: false, phases, before, after: getGitInfo().head, restartRequired: true }
  }
  const after = getGitInfo().head
  cachedLatest = null
  cachedAt = 0
  return { ok: true, phases, before, after, restartRequired: true }
}

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dir = path.join(root, 'data', 'analytics')
const eventsPath = path.join(dir, 'events.jsonl')
const configPath = path.join(dir, 'config.json')
const MAX_LINES = 5000

const ALLOWED = new Set([
  'page_view',
  'nav_click',
  'run_create',
  'channel_connect_click',
  'schedule_toggle',
  'update_check',
  'update_apply',
  'settings_change',
  'pipeline_run_click',
  'app_start',
])

function ensure() {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ enabled: true }, null, 2))
  }
  if (!fs.existsSync(eventsPath)) fs.writeFileSync(eventsPath, '')
}

export function readAnalyticsConfig() {
  ensure()
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch {
    return { enabled: true }
  }
}

export function writeAnalyticsConfig(cfg) {
  ensure()
  const next = { enabled: !!cfg.enabled }
  fs.writeFileSync(configPath, JSON.stringify(next, null, 2))
  return next
}

function sanitizeProps(props) {
  const out = {}
  if (!props || typeof props !== 'object') return out
  for (const [k, v] of Object.entries(props)) {
    if (typeof k !== 'string' || k.length > 40) continue
    if (typeof v === 'boolean' || typeof v === 'number') {
      if (Number.isFinite(v)) out[k] = v
    } else if (typeof v === 'string') {
      const s = v.slice(0, 64)
      if (!/[\\/]/.test(s) && !/@/.test(s) && !/token|secret|password|key/i.test(k)) {
        out[k] = s
      }
    }
  }
  return out
}

function rotateIfNeeded() {
  try {
    const raw = fs.readFileSync(eventsPath, 'utf8')
    const lines = raw.split('\n').filter(Boolean)
    if (lines.length <= MAX_LINES) return
    const keep = lines.slice(-Math.floor(MAX_LINES * 0.8))
    fs.writeFileSync(eventsPath, keep.join('\n') + '\n')
  } catch {}
}

export function ingestEvents(payload) {
  ensure()
  const cfg = readAnalyticsConfig()
  if (!cfg.enabled) return { ok: true, accepted: 0, disabled: true }

  const list = Array.isArray(payload?.events)
    ? payload.events
    : payload?.event
      ? [payload]
      : []

  let accepted = 0
  const webhook = process.env.CF_ANALYTICS_WEBHOOK || ''

  for (const item of list) {
    const event = String(item?.event || '')
    if (!ALLOWED.has(event)) continue
    const row = {
      id: randomUUID(),
      ts: new Date().toISOString(),
      sessionId: typeof item.sessionId === 'string' ? item.sessionId.slice(0, 64) : null,
      appVersion: typeof item.appVersion === 'string' ? item.appVersion.slice(0, 32) : null,
      event,
      props: sanitizeProps(item.props),
    }
    fs.appendFileSync(eventsPath, JSON.stringify(row) + '\n')
    accepted++
    if (webhook) {
      // optional owner remote sink (fire-and-forget stub)
      fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      }).catch(() => {})
    }
  }
  rotateIfNeeded()
  return { ok: true, accepted }
}

export function readEvents() {
  ensure()
  try {
    return fs
      .readFileSync(eventsPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

export function summarizeAnalytics() {
  const cfg = readAnalyticsConfig()
  const events = readEvents()
  const byEvent = {}
  const byDayMap = {}
  const pageMap = {}
  const sessions = new Set()

  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] || 0) + 1
    const day = String(e.ts || '').slice(0, 10)
    if (day) byDayMap[day] = (byDayMap[day] || 0) + 1
    if (e.sessionId) sessions.add(e.sessionId)
    if (e.event === 'page_view' && e.props && typeof e.props.page === 'string') {
      pageMap[e.props.page] = (pageMap[e.props.page] || 0) + 1
    }
  }

  const byDay = Object.entries(byDayMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, count]) => ({ day, count }))

  const topPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([page, count]) => ({ page, count }))

  return {
    enabled: !!cfg.enabled,
    total: events.length,
    byEvent,
    byDay,
    topPages,
    sessions: sessions.size,
  }
}

export function eventsFilePath() {
  ensure()
  return eventsPath
}

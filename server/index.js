// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  readPkg,
  getUpdateStatus,
  applyUpdate,
  fetchLatest,
  compareSemver,
} from './updates.js'

import {
  ingestEvents,
  summarizeAnalytics,
  readAnalyticsConfig,
  writeAnalyticsConfig,
  eventsFilePath,
} from './analytics.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dataDir = path.join(root, 'data')
const runsPath = path.join(dataDir, 'runs.json')
const PORT = Number(process.env.PORT || 8787)
const isProd = process.env.NODE_ENV === 'production'

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(runsPath)) {
  fs.writeFileSync(runsPath, JSON.stringify(seedRuns(), null, 2))
}

function seedRuns() {
  const now = Date.now()
  return [
    {
      id: 'run_20260905_001',
      createdAt: new Date(now - 3600_000 * 6).toISOString(),
      engine: 'long-v3',
      platforms: ['youtube'],
      status: 'published',
      url: 'https://youtube.com/@yevhenpotapov5956',
      note: 'Gold Standard hybrid 70/30',
    },
    {
      id: 'run_20260904_018',
      createdAt: new Date(now - 3600_000 * 20).toISOString(),
      engine: 'long-v3',
      platforms: ['youtube'],
      status: 'published',
      url: 'https://youtube.com/@yevhenpotapov5956',
      note: 'hold<=5s, YOLO/CLIP/OCR',
    },
    {
      id: 'run_20260904_012',
      createdAt: new Date(now - 3600_000 * 28).toISOString(),
      engine: 'long-v3',
      platforms: ['youtube', 'vk'],
      status: 'failed',
      url: null,
      note: 'VK adapter stub — skip',
    },
    {
      id: 'run_20260903_009',
      createdAt: new Date(now - 3600_000 * 48).toISOString(),
      engine: 'long-v3',
      platforms: ['youtube'],
      status: 'published',
      url: 'https://youtube.com/@yevhenpotapov5956',
      note: 'evening slot 18:00 Berlin',
    },
    {
      id: 'run_20260903_003',
      createdAt: new Date(now - 3600_000 * 54).toISOString(),
      engine: 'short-v1',
      platforms: ['youtube'],
      status: 'published',
      url: 'https://youtube.com/@yevhenpotapov5956',
      note: 'morning slot 11:00 Berlin',
    },
  ]
}

function readRuns() {
  try {
    return JSON.parse(fs.readFileSync(runsPath, 'utf8'))
  } catch {
    const s = seedRuns()
    fs.writeFileSync(runsPath, JSON.stringify(s, null, 2))
    return s
  }
}

function writeRuns(runs) {
  fs.writeFileSync(runsPath, JSON.stringify(runs, null, 2))
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  const runs = readRuns()
  const last = [...runs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )[0]
  const pkg = readPkg()
  const version = pkg.version || '0.0.0'
  let updateAvailable = false
  try {
    const remote = await fetchLatest(false)
    if (remote.version && compareSemver(remote.version, version) > 0) {
      updateAvailable = true
    }
  } catch {}
  res.json({
    ok: true,
    service: 'ContentForge',
    version,
    updateAvailable,
    env: process.env.CF_ENV || 'local',
    gateway: 'online',
    factory: 'online',
    timezone: 'Europe/Berlin',
    lastRun: last || null,
    nextSchedule: '18:00 Europe/Berlin',
    services: {
      comfyui: { status: 'mock-online', endpoint: 'http://127.0.0.1:8188' },
      ollama: { status: 'mock-online', endpoint: 'http://127.0.0.1:11434' },
      ffmpeg: { status: 'file-ok', path: '/usr/bin/ffmpeg' },
    },
    owner: 'Yevhen Potapov',
    youtube: '@yevhenpotapov5956',
  })
})


app.get('/api/channels', (_req, res) => {
  res.json({
    channels: [
      {
        id: 'yt',
        platform: 'youtube',
        label: 'YouTube',
        handle: '@yevhenpotapov5956',
        status: 'connected',
        privacyDefault: 'public',
        lastPublish: '2026-09-05T07:00:00+02:00',
        note: 'GitHub footer in descriptions',
        githubFooter: true,
      },
      {
        id: 'vk',
        platform: 'vk',
        label: 'VK Video',
        handle: null,
        status: 'disconnected',
        privacyDefault: 'public',
        lastPublish: null,
        note: 'Coming soon — paste access key later',
        githubFooter: false,
      },
      {
        id: 'twitch',
        platform: 'twitch',
        label: 'Twitch',
        handle: null,
        status: 'disconnected',
        privacyDefault: 'public',
        lastPublish: null,
        note: 'Coming soon — paste access key later',
        githubFooter: false,
      },
    ],
  })
})

app.get('/api/runs', (_req, res) => {
  const runs = readRuns().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )
  res.json({ runs })
})

app.post('/api/runs', (req, res) => {
  const body = req.body || {}
  const platforms = Array.isArray(body.platforms) && body.platforms.length
    ? body.platforms
    : ['youtube']
  const engine = body.engine || 'long-v3'
  const id = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  const run = {
    id,
    createdAt: new Date().toISOString(),
    engine,
    platforms,
    status: 'queued',
    url: null,
    note: body.note || 'Queued via ContentForge UI',
  }
  const runs = readRuns()
  runs.unshift(run)
  writeRuns(runs)
  res.status(201).json({ ok: true, run })
})


app.post('/api/analytics/event', (req, res) => {
  try {
    const result = ingestEvents(req.body || {})
    res.json(result)
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) })
  }
})

app.get('/api/analytics/summary', (_req, res) => {
  try {
    res.json(summarizeAnalytics())
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) })
  }
})

app.get('/api/analytics/config', (_req, res) => {
  res.json(readAnalyticsConfig())
})

app.post('/api/analytics/config', (req, res) => {
  const enabled = !!(req.body && req.body.enabled)
  const cfg = writeAnalyticsConfig({ enabled })
  res.json({ ok: true, ...cfg })
})

app.get('/api/analytics/export', (_req, res) => {
  try {
    const fp = eventsFilePath()
    res.setHeader('Content-Type', 'application/x-ndjson')
    res.setHeader('Content-Disposition', 'attachment; filename="contentforge-analytics.jsonl"')
    res.send(fs.readFileSync(fp, 'utf8'))
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) })
  }
})

app.get('/api/updates/status', async (req, res) => {
  try {
    const force = String(req.query.force || '') === '1'
    const status = await getUpdateStatus(force)
    res.json(status)
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) })
  }
})

app.post('/api/updates/apply', (_req, res) => {
  try {
    const result = applyUpdate()
    res.status(result.ok ? 200 : 500).json(result)
  } catch (e) {
    res.status(500).json({
      ok: false,
      phases: [{ name: 'apply', ok: false, detail: String(e && e.message || e) }],
      before: null,
      after: null,
      restartRequired: false,
    })
  }
})

app.get('/api/pipeline', (_req, res) => {
  res.json({
    name: 'LTX YouTube Gold Standard',
    version: '3.0',
    summary: {
      ru: 'Долгий движок: hold ≤5с, YOLO/CLIP/OCR, гибрид 70/30',
      en: 'Long engine: hold ≤5s, YOLO/CLIP/OCR, hybrid 70/30',
    },
    holdMaxSeconds: 5,
    detectors: ['YOLO', 'CLIP', 'OCR'],
    hybrid: { primary: 70, fallback: 30 },
    configPath: '/workspace/ltx-youtube/config/gold-standard-v3.json',
    repo: 'https://github.com/yevhenypupotapov-code/ltx-youtube-gold-standard',
    schedule: {
      timezone: 'Europe/Berlin',
      slots: ['11:00', '18:00'],
    },
    engines: [
      { id: 'long-v3', label: 'Long Engine v3', default: true },
      { id: 'short-v1', label: 'Short Engine v1', default: false },
    ],
  })
})

if (isProd) {
  const dist = path.join(root, 'dist')
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'))
    })
  }
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[ContentForge API] http://127.0.0.1:${PORT}`)
})

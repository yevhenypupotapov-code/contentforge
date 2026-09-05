export type Health = {
  ok: boolean
  service: string
  version?: string
  updateAvailable?: boolean
  env: string
  gateway: string
  factory: string
  timezone: string
  lastRun: Run | null
  nextSchedule: string
  services: Record<string, { status: string; endpoint?: string; path?: string }>
  owner: string
  youtube: string
}

export type Channel = {
  id: string
  platform: string
  label: string
  handle: string | null
  status: string
  privacyDefault: string
  lastPublish: string | null
  note: string
  githubFooter: boolean
}

export type Run = {
  id: string
  createdAt: string
  engine: string
  platforms: string[]
  status: string
  url: string | null
  note?: string
}

export type Pipeline = {
  name: string
  version: string
  summary: { ru: string; en: string }
  holdMaxSeconds: number
  detectors: string[]
  hybrid: { primary: number; fallback: number }
  configPath: string
  repo: string
  schedule: { timezone: string; slots: string[] }
  engines: { id: string; label: string; default: boolean }[]
}

export type UpdateStatus = {
  installed: string
  latest: string | null
  latestSha?: string | null
  latestSource?: string | null
  latestNotes?: string | null
  updateAvailable: boolean
  repo: string
  repoUrl: string
  git: { ok: boolean; branch: string | null; head: string | null; error?: string }
}

export type UpdateApplyResult = {
  ok: boolean
  phases: { name: string; ok: boolean; detail?: string }[]
  before: string | null
  after: string | null
  restartRequired: boolean
}

export type AnalyticsSummary = {
  enabled: boolean
  total: number
  byEvent: Record<string, number>
  byDay: { day: string; count: number }[]
  topPages: { page: string; count: number }[]
  sessions: number
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  health: () => req<Health>('/api/health'),
  channels: () => req<{ channels: Channel[] }>('/api/channels'),
  runs: () => req<{ runs: Run[] }>('/api/runs'),
  createRun: (body: { platforms?: string[]; engine?: string; note?: string }) =>
    req<{ ok: boolean; run: Run }>('/api/runs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  pipeline: () => req<Pipeline>('/api/pipeline'),
  updateStatus: (force = false) =>
    req<UpdateStatus>(`/api/updates/status${force ? '?force=1' : ''}`),
  updateApply: () =>
    req<UpdateApplyResult>('/api/updates/apply', { method: 'POST' }),
  analyticsSummary: () => req<AnalyticsSummary>('/api/analytics/summary'),
  analyticsConfig: () =>
    req<{ enabled: boolean }>('/api/analytics/config'),
  setAnalyticsConfig: (enabled: boolean) =>
    req<{ ok: boolean; enabled: boolean }>('/api/analytics/config', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
  analyticsEvent: (body: {
    event: string
    props?: Record<string, string | number | boolean>
    sessionId?: string
    appVersion?: string
  } | { events: unknown[] }) =>
    req<{ ok: boolean; accepted: number }>('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

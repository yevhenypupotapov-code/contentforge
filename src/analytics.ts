// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
const LS_OPT = 'cf_analytics_enabled'
const LS_SESSION = 'cf_analytics_session'
const LS_STARTED = 'cf_analytics_app_start'

function uuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function isAnalyticsEnabled(): boolean {
  try {
    const v = localStorage.getItem(LS_OPT)
    if (v === null) return true
    return v === '1' || v === 'true'
  } catch {
    return true
  }
}

export function setAnalyticsEnabled(on: boolean) {
  try {
    localStorage.setItem(LS_OPT, on ? '1' : '0')
  } catch {}
}

function sessionId(): string {
  try {
    let s = sessionStorage.getItem(LS_SESSION)
    if (!s) {
      s = uuid()
      sessionStorage.setItem(LS_SESSION, s)
    }
    return s
  } catch {
    return uuid()
  }
}

let cachedVersion: string | undefined

export function setAppVersion(v?: string) {
  cachedVersion = v
}

type Props = Record<string, string | number | boolean>

export async function track(event: string, props: Props = {}) {
  if (!isAnalyticsEnabled()) return
  if (props.once) {
    try {
      if (sessionStorage.getItem(LS_STARTED) === '1') return
      sessionStorage.setItem(LS_STARTED, '1')
    } catch {}
    const { once: _o, ...rest } = props
    props = rest
  }
  const clean: Props = {}
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      clean[k] = v
    }
  }
  try {
    await fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        props: clean,
        sessionId: sessionId(),
        appVersion: cachedVersion,
      }),
      keepalive: true,
    })
  } catch {}
}

export function trackPageView(page: string) {
  void track('page_view', { page })
}

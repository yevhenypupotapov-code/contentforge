// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Channel, type Health, type Run } from '../api'

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function statusBadge(s: string) {
  const map: Record<string, string> = {
    published: 'ok',
    queued: 'live',
    running: 'live',
    failed: 'err',
    connected: 'ok',
    disconnected: 'idle',
  }
  return map[s] || 'idle'
}

export function Overview() {
  const [health, setHealth] = useState<Health | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.health(), api.runs(), api.channels()])
      .then(([h, r, c]) => {
        setHealth(h)
        setRuns(r.runs.slice(0, 5))
        setChannels(c.channels)
      })
      .catch((e) => setErr(String(e.message || e)))
  }, [])

  const queueToday = runs.filter((r) => {
    const d = new Date(r.createdAt)
    const now = new Date()
    return (
      d.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }) ===
      now.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })
    )
  }).length

  return (
    <div>
      <div className="page-head">
        <h1>Обзор <span className="en">/ Overview</span></h1>
        <p>
          Состояние фабрики контента · health, очередь публикаций, последние запуски
        </p>
      </div>

      {err && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(248,113,113,0.4)' }}>
          API offline: <span className="mono">{err}</span>
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        {(['comfyui', 'ollama', 'ffmpeg'] as const).map((key) => {
          const svc = health?.services?.[key]
          return (
            <div className="card" key={key}>
              <h3>{key.toUpperCase()}</h3>
              <div className="metric sm">
                <span className={`badge ${svc?.status?.includes('ok') || svc?.status?.includes('online') ? 'ok' : 'warn'}`}>
                  {svc?.status || '…'}
                </span>
              </div>
              <div className="muted mono" style={{ marginTop: '0.5rem' }}>
                {svc?.endpoint || svc?.path || '—'}
              </div>
            </div>
          )
        })}
        <div className="card">
          <h3>Очередь сегодня / Today</h3>
          <div className="metric">{queueToday}</div>
          <div className="muted">публикации / publishes</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Последние 5 запусков <span className="en">/ Last runs</span></h2>
          <ul className="list-compact">
            {runs.map((r) => (
              <li key={r.id}>
                <span>
                  <span className="mono">{r.id}</span>
                  <br />
                  <span className="muted">{fmt(r.createdAt)} · {r.engine}</span>
                </span>
                <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
              </li>
            ))}
            {!runs.length && <li className="muted">Нет данных</li>}
          </ul>
          <div style={{ marginTop: '0.75rem' }}>
            <Link className="btn btn-ghost" to="/runs">Все запуски →</Link>
          </div>
        </div>

        <div className="card">
          <h2>Каналы <span className="en">/ Channel status</span></h2>
          <ul className="list-compact">
            {channels.map((c) => (
              <li key={c.id}>
                <span>
                  <strong>{c.label}</strong>
                  <br />
                  <span className="muted mono">{c.handle || 'not linked'}</span>
                </span>
                <span className={`badge ${statusBadge(c.status)}`}>{c.status}</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '0.75rem' }}>
            <Link className="btn btn-ghost" to="/channels">Управление →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { api, type Run } from '../api'
import { track } from '../analytics'

function fmt(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(iso))
}

function badge(s: string) {
  if (s === 'published') return 'ok'
  if (s === 'queued' || s === 'running') return 'live'
  if (s === 'failed') return 'err'
  return 'idle'
}

export function Runs() {
  const [runs, setRuns] = useState<Run[]>([])
  const [busy, setBusy] = useState(false)
  const [platforms, setPlatforms] = useState<string[]>(['youtube'])
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    api
      .runs()
      .then((r) => setRuns(r.runs))
      .catch((e) => setErr(String(e.message || e)))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function togglePlatform(p: string) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  async function create() {
    if (!platforms.length) return
    setBusy(true)
    setErr(null)
    try {
      track('run_create', { source: 'runs' }); await api.createRun({
        platforms,
        engine: 'long-v3',
        note: 'Created from Runs page',
      })
      load()
    } catch (e: unknown) {
      setErr(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Запуски <span className="en">/ Runs</span></h1>
        <p>История mock + API-created jobs · хранится в data/runs.json</p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>Новый запуск <span className="en">/ Create run</span></h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {(['youtube', 'vk', 'twitch'] as const).map((p) => (
            <label key={p} style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={platforms.includes(p)}
                onChange={() => togglePlatform(p)}
              />
              {p}
            </label>
          ))}
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy || !platforms.length}
            onClick={create}
          >
            {busy ? 'Создание…' : 'Создать run'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={load}>
            Обновить
          </button>
        </div>
        {err && <p className="muted" style={{ color: 'var(--red)' }}>{err}</p>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Time (Berlin)</th>
                <th>Engine</th>
                <th>Platforms</th>
                <th>Status</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{fmt(r.createdAt)}</td>
                  <td className="mono">{r.engine}</td>
                  <td>{r.platforms.join(', ')}</td>
                  <td>
                    <span className={`badge ${badge(r.status)}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" className="mono">
                        open
                      </a>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    Нет запусков
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

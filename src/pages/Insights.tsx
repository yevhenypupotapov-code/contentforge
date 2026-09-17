// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
import { useCallback, useEffect, useState } from 'react'
import { api, type AnalyticsSummary } from '../api'

export function Insights() {
  const [sum, setSum] = useState<AnalyticsSummary | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      setSum(await api.analyticsSummary())
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const byEvent = sum ? Object.entries(sum.byEvent).sort((a, b) => b[1] - a[1]) : []

  return (
    <div>
      <div className="page-head">
        <h1>Аналитика <span className="en">/ Insights</span></h1>
        <p>
          Локальные агрегаты (без PII). Owner dashboard для улучшения ContentForge.
        </p>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" type="button" disabled={loading} onClick={() => void load()}>
          {loading ? '…' : 'Обновить / Refresh'}
        </button>
        <a className="btn btn-teal" href="/api/analytics/export" target="_blank" rel="noreferrer">
          Export JSONL
        </a>
      </div>

      {err && <p className="muted" style={{ color: 'var(--red)' }}>{err}</p>}

      <div className="grid grid-4" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <h2>Всего событий</h2>
          <div className="metric">{sum?.total ?? '—'}</div>
          <p className="muted">Total events</p>
        </div>
        <div className="card">
          <h2>Сессии</h2>
          <div className="metric">{sum?.sessions ?? '—'}</div>
          <p className="muted">Distinct sessions</p>
        </div>
        <div className="card">
          <h2>Сбор</h2>
          <div className="metric sm">
            {sum?.enabled === false ? (
              <span className="badge warn">OFF</span>
            ) : (
              <span className="badge ok">ON</span>
            )}
          </div>
          <p className="muted">Server flag</p>
        </div>
        <div className="card">
          <h2>Дней</h2>
          <div className="metric">{sum?.byDay?.length ?? '—'}</div>
          <p className="muted">Days with activity</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>По событиям / By event</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Event</th><th>Count</th></tr>
              </thead>
              <tbody>
                {byEvent.length === 0 && (
                  <tr><td colSpan={2} className="muted">Нет данных</td></tr>
                )}
                {byEvent.map(([ev, n]) => (
                  <tr key={ev}>
                    <td className="mono">{ev}</td>
                    <td>{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Топ страниц / Top pages</h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Page</th><th>Views</th></tr>
              </thead>
              <tbody>
                {(sum?.topPages || []).length === 0 && (
                  <tr><td colSpan={2} className="muted">Нет данных</td></tr>
                )}
                {(sum?.topPages || []).map((r) => (
                  <tr key={r.page}>
                    <td className="mono">{r.page}</td>
                    <td>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2>По дням / By day</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Day (UTC)</th><th>Count</th></tr>
            </thead>
            <tbody>
              {(sum?.byDay || []).length === 0 && (
                <tr><td colSpan={2} className="muted">Нет данных</td></tr>
              )}
              {(sum?.byDay || []).slice().reverse().map((r) => (
                <tr key={r.day}>
                  <td className="mono">{r.day}</td>
                  <td>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

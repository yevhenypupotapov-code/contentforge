import { useEffect, useState } from 'react'
import { api, type Pipeline as PipelineT, type Run } from '../api'
import { track } from '../analytics'

export function Pipeline() {
  const [pipe, setPipe] = useState<PipelineT | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [last, setLast] = useState<Run | null>(null)

  useEffect(() => {
    api.pipeline().then(setPipe).catch((e) => setMsg(String(e.message || e)))
  }, [])

  async function runLong() {
    setBusy(true)
    setMsg(null)
    try {
      track('pipeline_run_click', { source: 'pipeline' })
      const res = await api.createRun({
        engine: 'long-v3',
        platforms: ['youtube'],
        note: 'Run long engine from Pipeline UI',
      })
      setLast(res.run)
      setMsg(`Задание в очереди / Queued: ${res.run.id}`)
    } catch (e: unknown) {
      setMsg(String((e as Error).message || e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Пайплайн <span className="en">/ Pipeline</span></h1>
        <p>Gold Standard v3.0 — LTX YouTube factory</p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <h2>
            {pipe?.name || '…'}{' '}
            <span className="badge live">v{pipe?.version || '3.0'}</span>
          </h2>
          <p style={{ marginTop: 0 }}>{pipe?.summary.ru}</p>
          <p className="muted" style={{ marginTop: 0 }}>{pipe?.summary.en}</p>
          <dl className="kv" style={{ marginTop: '1rem' }}>
            <div className="kv-row">
              <dt>Hold max</dt>
              <dd>≤ {pipe?.holdMaxSeconds ?? 5}s</dd>
            </div>
            <div className="kv-row">
              <dt>Detectors</dt>
              <dd>{pipe?.detectors?.join(' / ') || 'YOLO / CLIP / OCR'}</dd>
            </div>
            <div className="kv-row">
              <dt>Hybrid</dt>
              <dd>
                {pipe?.hybrid?.primary ?? 70}% / {pipe?.hybrid?.fallback ?? 30}%
              </dd>
            </div>
            <div className="kv-row">
              <dt>Config</dt>
              <dd className="mono">{pipe?.configPath || '…'}</dd>
            </div>
            <div className="kv-row">
              <dt>Repo</dt>
              <dd>
                <a href={pipe?.repo} target="_blank" rel="noreferrer">
                  ltx-youtube-gold-standard
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2>Действия <span className="en">/ Actions</span></h2>
          <p className="muted">
            Запускает stub API: создаёт queued job в{' '}
            <span className="mono">data/runs.json</span>
          </p>
          <button
            className="btn btn-primary"
            type="button"
            disabled={busy}
            onClick={runLong}
            style={{ marginTop: '0.5rem' }}
          >
            {busy ? 'Старт…' : '▶ Run long engine'}
          </button>
          {msg && (
            <p style={{ marginTop: '0.9rem' }}>
              <span className="badge live">{msg}</span>
            </p>
          )}
          {last && (
            <dl className="kv" style={{ marginTop: '1rem' }}>
              <div className="kv-row">
                <dt>Job ID</dt>
                <dd className="mono">{last.id}</dd>
              </div>
              <div className="kv-row">
                <dt>Status</dt>
                <dd><span className="badge live">{last.status}</span></dd>
              </div>
              <div className="kv-row">
                <dt>Platforms</dt>
                <dd>{last.platforms.join(', ')}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Engines</h2>
        <ul className="list-compact">
          {(pipe?.engines || [
            { id: 'long-v3', label: 'Long Engine v3', default: true },
            { id: 'short-v1', label: 'Short Engine v1', default: false },
          ]).map((e) => (
            <li key={e.id}>
              <span>
                <strong>{e.label}</strong>
                <br />
                <span className="mono muted">{e.id}</span>
              </span>
              {e.default ? (
                <span className="badge ok">default</span>
              ) : (
                <span className="badge idle">optional</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

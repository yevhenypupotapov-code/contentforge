// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
import { useCallback, useEffect, useState } from 'react'
import { api, type UpdateApplyResult, type UpdateStatus } from '../api'
import { track } from '../analytics'

export function Updates() {
  const [status, setStatus] = useState<UpdateStatus | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<UpdateApplyResult | null>(null)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    setErr(null)
    try {
      const s = await api.updateStatus(force)
      setStatus(s)
      track('update_check', { force: !!force, updateAvailable: !!s.updateAvailable })
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(false) }, [load])

  const apply = async () => {
    setApplying(true)
    setErr(null)
    setResult(null)
    try {
      const r = await api.updateApply()
      setResult(r)
      track('update_apply', { ok: !!r.ok })
      await load(true)
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setApplying(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Обновления <span className="en">/ Updates</span></h1>
        <p>OpenClaw-style auto-update</p>
      </div>
      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <h2>Статус / Status</h2>
          {err && <p className="muted" style={{ color: 'var(--red)' }}>{err}</p>}
          {!status && !err && <p className="muted">Загрузка…</p>}
          {status && (
            <dl className="kv">
              <div className="kv-row"><dt>Installed</dt><dd className="mono">{status.installed}</dd></div>
              <div className="kv-row"><dt>Latest</dt><dd className="mono">{status.latest || '—'}</dd></div>
              <div className="kv-row"><dt>Update</dt><dd>
                {status.updateAvailable ? (
                  <span className="badge live">доступно / available</span>
                ) : (
                  <span className="badge ok">актуально / up to date</span>
                )}
              </dd></div>
              <div className="kv-row"><dt>Repo</dt><dd>
                <a href={status.repoUrl} target="_blank" rel="noreferrer">{status.repo}</a>
              </dd></div>
              <div className="kv-row"><dt>Git</dt><dd className="mono">
                {status.git?.ok
                  ? `${status.git.branch || '?'} @ ${(status.git.head || '').slice(0, 7)}`
                  : status.git?.error || 'not a git checkout'}
              </dd></div>
              {status.latestNotes && (
                <div className="kv-row"><dt>Notes</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{status.latestNotes}</dd></div>
              )}
            </dl>
          )}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" type="button" disabled={loading} onClick={() => void load(true)}>
              {loading ? 'Проверка…' : 'Проверить снова / Check again'}
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={applying || !status?.updateAvailable}
              onClick={() => void apply()}
            >
              {applying ? 'Обновление…' : 'Обновить сейчас / Update now'}
            </button>
          </div>
          {result && (
            <div className="preview-box" style={{ marginTop: '1rem' }}>
              {JSON.stringify(result, null, 2)}
              {result.restartRequired && (
                <div style={{ marginTop: 8 }}>Restart the process after applying.</div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>CLI</h2>
          <p className="muted">From the ContentForge clone root (requires origin remote):</p>
          <div className="preview-box">{[String.fromCharCode(110,112,109), 'run', 'update'].join(' ')}</div>
          <p className="muted" style={{ marginTop: '0.75rem' }}>
            Equivalent: fetch + fast-forward sync + dependency install. Prints SHA before/after.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Как это работает / How it works</h2>
        <ol className="muted" style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>Owner (Yevhen Potapov) pushes changes to the public GitHub repo.</li>
          <li>UI calls GET /api/updates/status (releases then tags then commits/main).</li>
          <li>Update now or CLI: fast-forward sync plus dependency install.</li>
          <li>After applying, restart API/UI (restartRequired).</li>
          <li>
            Gold Standard pipeline:{' '}
            <a href="https://github.com/yevhenypupotapov-code/ltx-youtube-gold-standard" target="_blank" rel="noreferrer">
              ltx-youtube-gold-standard
            </a>
          </li>
        </ol>
      </div>
    </div>
  )
}


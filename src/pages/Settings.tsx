import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { isAnalyticsEnabled, setAnalyticsEnabled, track } from '../analytics'

const ENV_ROWS = [
  { key: 'LTX_OUTPUT_DIR', example: '/workspace/ltx-youtube/out', note: 'Каталог рендера' },
  { key: 'LTX_CONFIG', example: 'config/gold-standard-v3.json', note: 'Путь к конфигу' },
  { key: 'LTX_TZ', example: 'Europe/Berlin', note: 'Часовой пояс слотов' },
  { key: 'LTX_ENGINE', example: 'long-v3', note: 'Движок по умолчанию' },
  { key: 'LTX_YT_CHANNEL', example: '@yevhenpotapov5956', note: 'YouTube handle' },
  { key: 'LTX_PRIVACY', example: 'public', note: 'Privacy default' },
]

const GH_GOLD =
  'https://github.com/yevhenypupotapov-code/ltx-youtube-gold-standard'
const GH_OWNER = 'https://github.com/yevhenypupotapov-code'
const GH_CF = 'https://github.com/yevhenypupotapov-code/contentforge'

export function Settings() {
  const [privacy, setPrivacy] = useState('public')
  const [analyticsOn, setAnalyticsOn] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setAnalyticsOn(isAnalyticsEnabled())
    api.analyticsConfig().then((c) => {
      if (typeof c.enabled === 'boolean') {
        setAnalyticsOn(c.enabled && isAnalyticsEnabled())
      }
    }).catch(() => {})
  }, [])

  const footerPreview = useMemo(
    () =>
      [
        '—',
        'Pipeline: LTX YouTube Gold Standard v3.0',
        `Repo: ${GH_GOLD}`,
        `Owner: ${GH_OWNER}`,
        'Channel: @yevhenpotapov5956 · ContentForge',
      ].join('\n'),
    []
  )

  const toggleAnalytics = async (on: boolean) => {
    setAnalyticsOn(on)
    setAnalyticsEnabled(on)
    setSaving(true)
    try {
      await api.setAnalyticsConfig(on)
      track('settings_change', { key: 'analytics', enabled: on })
    } catch {}
    setSaving(false)
  }

  return (
    <div>
      <div className="page-head">
        <h1>Настройки <span className="en">/ Settings</span></h1>
        <p>
          Env LTX_* · GitHub · privacy · analytics · preview футера (без секретов)
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <h2>Environment · LTX_*</h2>
          <p className="muted">
            Demo-справочник. Реальные значения задаются в окружении фабрики, не в UI.
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Var</th>
                  <th>Example</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {ENV_ROWS.map((r) => (
                  <tr key={r.key}>
                    <td className="mono">{r.key}</td>
                    <td className="mono muted">{r.example}</td>
                    <td>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>GitHub & privacy</h2>
          <dl className="kv">
            <div className="kv-row">
              <dt>ContentForge</dt>
              <dd>
                <a href={GH_CF} target="_blank" rel="noreferrer">
                  contentforge
                </a>
              </dd>
            </div>
            <div className="kv-row">
              <dt>Gold Standard</dt>
              <dd>
                <a href={GH_GOLD} target="_blank" rel="noreferrer">
                  ltx-youtube-gold-standard
                </a>
              </dd>
            </div>
            <div className="kv-row">
              <dt>Owner org</dt>
              <dd>
                <a href={GH_OWNER} target="_blank" rel="noreferrer">
                  yevhenypupotapov-code
                </a>
              </dd>
            </div>
            <div className="kv-row">
              <dt>Privacy default</dt>
              <dd>
                <select
                  value={privacy}
                  onChange={(e) => {
                    setPrivacy(e.target.value)
                    track('settings_change', { key: 'privacy', value: e.target.value })
                  }}
                  style={{
                    background: 'var(--bg-elev)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '0.35rem 0.5rem',
                  }}
                >
                  <option value="public">public</option>
                  <option value="unlisted">unlisted</option>
                  <option value="private">private</option>
                </select>
                <span className="muted" style={{ marginLeft: 8 }}>
                  (UI demo → LTX_PRIVACY)
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>Сбор аналитики / Analytics</h2>
        <p className="muted">
          Privacy-first, local-only (data/analytics). No PII, no third-party SaaS.
          Default ON for free public MVP — можно выключить.
        </p>
        <div className="toggle-row">
          <div>
            <strong>Сбор аналитики</strong>
            <div className="muted">page_view, nav, runs, updates… · {saving ? 'saving…' : 'local + server flag'}</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={analyticsOn}
              onChange={(e) => void toggleAnalytics(e.target.checked)}
            />
            <span />
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Description footer preview</h2>
        <p className="muted">
          Текст, который Gold Standard добавляет в конец YouTube description
          (GitHub links). Privacy: <strong>{privacy}</strong>
        </p>
        <div className="preview-box">{footerPreview}</div>
      </div>
    </div>
  )
}

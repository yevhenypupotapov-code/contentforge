import { useEffect, useState } from 'react'
import { api, type Channel } from '../api'
import { track } from '../analytics'

function fmt(iso?: string | null) {
  if (!iso) return 'ещё не публиковали / never'
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function Channels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.channels().then((r) => setChannels(r.channels)).catch(() => {})
  }, [])

  function connectStub(label: string) {
    setToast(
      `${label}: скоро / coming soon — вставьте ключ доступа позже (UI-only stub, без OAuth)`
    )
  }

  return (
    <div>
      <div className="page-head">
        <h1>Каналы <span className="en">/ Channels</span></h1>
        <p>
          YouTube подключён (demo) · VK Video и Twitch — stubs · без секретов в репо
        </p>
      </div>

      {toast && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(45,212,191,0.35)' }}>
          {toast}
        </div>
      )}

      <div className="grid grid-3">
        {channels.map((c) => (
          <div className="card" key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <h2 style={{ margin: 0 }}>{c.label}</h2>
              <span className={`badge ${c.status === 'connected' ? 'ok' : 'idle'}`}>
                {c.status}
              </span>
            </div>
            <p className="mono muted" style={{ margin: '0.55rem 0' }}>
              {c.handle || '—'}
            </p>
            <dl className="kv">
              <div className="kv-row">
                <dt>Privacy</dt>
                <dd>{c.privacyDefault}</dd>
              </div>
              <div className="kv-row">
                <dt>Last publish</dt>
                <dd>{fmt(c.lastPublish)}</dd>
              </div>
              <div className="kv-row">
                <dt>Note</dt>
                <dd>{c.note}</dd>
              </div>
            </dl>
            {c.githubFooter && (
              <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
                Footer: ссылки на GitHub gold-standard в описаниях YT
              </p>
            )}
            {c.status !== 'connected' ? (
              <button
                className="btn btn-teal"
                type="button"
                style={{ marginTop: '0.85rem', width: '100%' }}
                onClick={() => { track('channel_connect_click', { platform: c.platform }); connectStub(c.label) }}
              >
                Подключить / Connect
              </button>
            ) : (
              <button
                className="btn btn-ghost"
                type="button"
                style={{ marginTop: '0.85rem', width: '100%' }}
                disabled
              >
                Connected (demo)
              </button>
            )}
          </div>
        ))}

        <div
          className="card"
          style={{
            borderStyle: 'dashed',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 220,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', opacity: 0.5 }}>＋</div>
          <h2 style={{ margin: '0.5rem 0 0.25rem' }}>Add channel</h2>
          <p className="muted" style={{ margin: 0 }}>
            Placeholder — расширяемый адаптер (TikTok / Rutube / …)
          </p>
          <button
            className="btn btn-ghost"
            type="button"
            style={{ marginTop: '0.9rem' }}
            onClick={() =>
              setToast('Add channel: placeholder. Extensible platform adapter soon.')
            }
          >
            Скоро / Coming soon
          </button>
        </div>
      </div>
    </div>
  )
}

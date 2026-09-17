// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
import { track } from '../analytics'
import { useEffect, useState } from 'react'

const SLOTS = [
  { id: 'slot-1100', time: '11:00', label: 'Утро / Morning', tz: 'Europe/Berlin' },
  { id: 'slot-1800', time: '18:00', label: 'Вечер / Evening', tz: 'Europe/Berlin' },
] as const

const LS_KEY = 'contentforge.schedule.enabled'

type EnabledMap = Record<string, boolean>

function loadEnabled(): EnabledMap {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as EnabledMap
  } catch { /* ignore */ }
  return { 'slot-1100': true, 'slot-1800': true }
}

export function Schedule() {
  const [enabled, setEnabled] = useState<EnabledMap>(() => loadEnabled())

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(enabled))
  }, [enabled])

  function toggle(id: string) {
    setEnabled((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      track('schedule_toggle', { slot: id, enabled: !!next[id] })
      return next
    })
  }

  const nowBerlin = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date())

  return (
    <div>
      <div className="page-head">
        <h1>Расписание <span className="en">/ Schedule</span></h1>
        <p>
          Слоты LTX factory · 11:00 и 18:00 Europe/Berlin · toggles в localStorage
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>Часовой пояс</h2>
        <p className="metric sm" style={{ margin: 0 }}>Europe/Berlin</p>
        <p className="muted" style={{ margin: '0.4rem 0 0' }}>
          Сейчас: {nowBerlin}
        </p>
      </div>

      <div className="card">
        <h2>Слоты публикации <span className="en">/ Publish slots</span></h2>
        {SLOTS.map((s) => (
          <div className="toggle-row" key={s.id}>
            <div>
              <div style={{ fontWeight: 650, fontSize: '1.1rem' }}>
                {s.time}{' '}
                <span className="muted" style={{ fontWeight: 400, fontSize: '0.85rem' }}>
                  {s.tz}
                </span>
              </div>
              <div className="muted">{s.label}</div>
            </div>
            <label className="switch" title={enabled[s.id] ? 'enabled' : 'disabled'}>
              <input
                type="checkbox"
                checked={!!enabled[s.id]}
                onChange={() => toggle(s.id)}
              />
              <span />
            </label>
          </div>
        ))}
        <p className="muted" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          Состояние сохраняется локально (
          <span className="mono">{LS_KEY}</span>
          ). Реальный cron — на стороне LTX factory.
        </p>
      </div>
    </div>
  )
}

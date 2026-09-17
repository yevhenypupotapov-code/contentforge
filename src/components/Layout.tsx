// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { api, type Health } from '../api'
import { track, trackPageView, setAppVersion } from '../analytics'

const NAV = [
  { to: '/', label: 'Обзор', en: 'Overview', end: true, ico: '◎', id: 'overview' },
  { to: '/pipeline', label: 'Пайплайн', en: 'Pipeline', ico: '⇢', id: 'pipeline' },
  { to: '/channels', label: 'Каналы', en: 'Channels', ico: '▣', id: 'channels' },
  { to: '/schedule', label: 'Расписание', en: 'Schedule', ico: '◷', id: 'schedule' },
  { to: '/runs', label: 'Запуски', en: 'Runs', ico: '≡', id: 'runs' },
  { to: '/updates', label: 'Обновления', en: 'Updates', ico: '↻', id: 'updates' },
  { to: '/insights', label: 'Аналитика', en: 'Insights', ico: '▦', id: 'insights' },
  { to: '/settings', label: 'Настройки', en: 'Settings', ico: '⚙', id: 'settings' },
]

function fmtTime(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Berlin',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function Layout() {
  const [open, setOpen] = useState(false)
  const [health, setHealth] = useState<Health | null>(null)
  const location = useLocation()

  useEffect(() => {
    track('app_start', { once: true })
  }, [])

  useEffect(() => {
    const page =
      location.pathname === '/'
        ? 'overview'
        : location.pathname.replace(/^\//, '') || 'overview'
    trackPageView(page)
  }, [location.pathname])

  useEffect(() => {
    let alive = true
    const load = () =>
      api.health().then((h) => { if (alive) { setHealth(h); setAppVersion(h.version) } }).catch(() => {})
    load()
    const t = setInterval(load, 15000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  return (
    <div className="app-shell">
      <div
        className={`sidebar-backdrop${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">CF</div>
          <div className="brand-text">
            <div className="brand-name">ContentForge</div>
            <div className="brand-sub">Content Factory Control</div>
          </div>
        </div>
        <div className="env-pill">{health?.env || 'local'}</div>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => {
                setOpen(false)
                track('nav_click', { page: item.id })
              }}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <span className="nav-ico">{item.ico}</span>
              <span>
                {item.label}{' '}
                <span className="en">/ {item.en}</span>
                {item.id === 'updates' && health?.updateAvailable ? (
                  <span className="badge live" style={{ marginLeft: 6 }}>new</span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          Owner: Yevhen Potapov
          <br />
          YT: @yevhenpotapov5956
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" type="button" onClick={() => setOpen(true)}>
            ☰ Меню
          </button>
          <div className="top-status">
            {health?.version && (
              <span className="status-chip">
                v<strong className="mono">{health.version}</strong>
                {health.updateAvailable ? (
                  <span className="badge live" style={{ marginLeft: 6 }}>update</span>
                ) : null}
              </span>
            )}
            <span className="status-chip">
              <span className={`dot ${health?.gateway === 'online' ? 'online' : 'warn'}`} />
              Gateway: <strong>{health?.gateway || '…'}</strong>
            </span>
            <span className="status-chip">
              <span className={`dot ${health?.factory === 'online' ? 'online' : 'warn'}`} />
              Factory: <strong>{health?.factory || '…'}</strong>
            </span>
            <span className="status-chip">
              Last run:{' '}
              <strong className="mono">{fmtTime(health?.lastRun?.createdAt)}</strong>
            </span>
            <span className="status-chip">
              Next:{' '}
              <strong>{health?.nextSchedule || '18:00 Europe/Berlin'}</strong>
            </span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

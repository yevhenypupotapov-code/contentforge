# ContentForge

OpenClaw-inspired dark dashboard for a multi-platform content factory (YouTube, VK Video, Twitch).

**Owner / copyright:** Yevhen Potapov only · YT @yevhenpotapov5956

**License:** Proprietary — free to download and run for personal/internal use. See LICENSE. Do not sell, rebrand, or claim ownership without written permission from Yevhen Potapov.

Gold Standard: https://github.com/yevhenypupotapov-code/ltx-youtube-gold-standard

Repo: https://github.com/yevhenypupotapov-code/contentforge

## What it is

- Overview — factory health, today volume, last runs, channels
- Pipeline — Gold Standard v3.0
- Channels — YouTube demo, VK/Twitch stubs
- Schedule — 11:00 / 18:00 Europe/Berlin
- Runs — mock + API jobs
- Updates — OpenClaw-style auto-update
- Insights — local product analytics
- Settings — env refs, privacy, analytics toggle

RU primary labels, EN secondary.

## Stack

Vite + React + TypeScript, plain CSS, Express API.

Ports: UI **5173**, API **8787** (Vite proxies /api).

## Clone and run

- Repository: https://github.com/yevhenypupotapov-code/contentforge
- Install dependencies, then start combined UI+API (dev)
- UI http://127.0.0.1:5173 · API http://127.0.0.1:8787

## Updates

Owner pushes to GitHub. Users refresh via UI page Updates or the package `update` script.
Restart the process after applying.
See GET /api/updates/status and POST /api/updates/apply. Health returns version + updateAvailable.

## Analytics (privacy-first, local-only)

Product usage events so Yevhen can improve ContentForge. No third-party SaaS.

Events (no PII): page_view, nav_click, run_create, channel_connect_click, schedule_toggle, update_check, update_apply, settings_change, pipeline_run_click, app_start.

Shape: { id, ts, sessionId, appVersion, event, props } — props are enums/counts/booleans only.

Storage: data/analytics/events.jsonl (capped ~5000 lines) + data/analytics/config.json.

Opt out: Settings toggle «Сбор аналитики» OFF, or set enabled false in config.json.

Owner APIs: /api/analytics/summary, /api/analytics/export, /api/analytics/event.
Optional env CF_ANALYTICS_WEBHOOK for owner remote sink (stub).

## License

Proprietary (c) 2026 Yevhen Potapov. Free public download/use under LICENSE. Ownership remains with Yevhen Potapov.

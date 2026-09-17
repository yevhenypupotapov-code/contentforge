// Copyright (c) 2026 Yevhen Potapov. All rights reserved.
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Overview } from './pages/Overview'
import { Pipeline } from './pages/Pipeline'
import { Channels } from './pages/Channels'
import { Schedule } from './pages/Schedule'
import { Runs } from './pages/Runs'
import { Settings } from './pages/Settings'
import { Updates } from './pages/Updates'
import { Insights } from './pages/Insights'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="channels" element={<Channels />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="runs" element={<Runs />} />
        <Route path="updates" element={<Updates />} />
        <Route path="insights" element={<Insights />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

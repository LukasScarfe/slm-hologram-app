import { AppShell } from './components/layout/AppShell.jsx'
import { SLMTabBar } from './components/layout/SLMTabBar.jsx'
import { SLMPanel } from './components/slm/SLMPanel.jsx'
import { useSLMStore } from './store/useSLMStore.js'

function App() {
  const slms = useSLMStore((s) => s.slms)
  const activeSLMId = useSLMStore((s) => s.activeSLMId)

  return (
    <AppShell>
      <SLMTabBar />
      {slms.map((slm) => (
        <div
          key={slm.id}
          data-slm-panel={slm.id}
          data-active-panel={slm.id === activeSLMId ? 'true' : undefined}
          style={{ display: slm.id === activeSLMId ? 'block' : 'none' }}
        >
          <SLMPanel slmId={slm.id} />
        </div>
      ))}
    </AppShell>
  )
}

export default App

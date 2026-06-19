import { TopBar } from './TopBar.jsx';
import { TooltipProvider } from '../shared/Tooltip.jsx';

export function AppShell({ children }) {
  return (
    <TooltipProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0B0E14' }}>
        <TopBar />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}

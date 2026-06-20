import * as RadixTooltip from '@radix-ui/react-tooltip';
import { TOOLTIPS } from '../../data/tooltips.js';

export function TooltipProvider({ children }) {
  return (
    <RadixTooltip.Provider delayDuration={0}>
      {children}
    </RadixTooltip.Provider>
  );
}

export function Tooltip({ tooltipKey, children }) {
  const entry = TOOLTIPS[tooltipKey];

  if (!entry) {
    return (
      <span>
        {children}
        {import.meta.env.DEV && (
          <span style={{ color: 'red', fontSize: '10px' }}>[missing tooltip]</span>
        )}
      </span>
    );
  }

  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side="top"
          sideOffset={4}
          style={{
            background: '#1C2330',
            color: '#E8EDF3',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            maxWidth: '320px',
            lineHeight: '1.5',
            border: '1px solid #2a3344',
            zIndex: 9999,
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{entry.label}</p>
          <p style={{ marginBottom: '4px' }}>{entry.description}</p>
          {entry.example && (
            <p style={{ fontStyle: 'italic', color: '#A8B8C8' }}>{entry.example}</p>
          )}
          <RadixTooltip.Arrow style={{ fill: '#1C2330' }} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

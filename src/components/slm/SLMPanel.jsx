import { SLMConfigSection } from './SLMConfigSection.jsx';
import { HologramParamsSection } from './HologramParamsSection.jsx';
import { SLMPreview } from './SLMPreview.jsx';
import { SLMDisplayButton } from './SLMDisplayButton.jsx';
import { SLMExportImport } from './SLMExportImport.jsx';
import { ModeStack } from '../modes/ModeStack.jsx';
import { SectionHeader } from '../shared/SectionHeader.jsx';

export function SLMPanel({ slmId }) {
  return (
    <div data-slm-id={slmId} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {/* Top: config + preview side by side */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Left column: hardware config + hologram params */}
        <div style={{ flex: '0 0 300px', minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SLMConfigSection slmId={slmId} />
          <HologramParamsSection slmId={slmId} />
        </div>

        {/* Right column: preview + controls row */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SLMPreview slmId={slmId} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <SLMDisplayButton slmId={slmId} />
            <SLMExportImport slmId={slmId} />
          </div>
        </div>
      </div>

      {/* Bottom: mode stack */}
      <div>
        <SectionHeader>Mode Stack</SectionHeader>
        <ModeStack slmId={slmId} />
      </div>
    </div>
  );
}

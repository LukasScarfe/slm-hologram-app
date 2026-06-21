import * as Select from '@radix-ui/react-select';
import { useSLMStore } from '../../store/useSLMStore.js';
import { Tooltip } from '../shared/Tooltip.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';
import { SectionHeader } from '../shared/SectionHeader.jsx';
import presets from '../../data/slmPresets.json';

const CONTROL_WIDTH = 136;

const selectStyle = {
  background: '#1C2330',
  color: '#E8EDF3',
  border: '1px solid #2a3344',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '13px',
  width: '100%',
  cursor: 'pointer',
};

const unitBadgeStyle = {
  color: '#22c55e',
  border: '1px solid #22c55e',
  borderRadius: '4px',
  padding: '1px 5px',
  fontSize: '11px',
  lineHeight: '16px',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  minWidth: '44px',
  textAlign: 'center',
};

function UnitBadge({ unit }) {
  return <span style={unitBadgeStyle}>{unit}</span>;
}

export function SLMConfigSection({ slmId }) {
  const slm = useSLMStore((state) => state.slms.find((s) => s.id === slmId));
  const selectPreset = useSLMStore((state) => state.selectPreset);
  const updateHardware = useSLMStore((state) => state.updateHardware);

  if (!slm) return null;

  const { hardware } = slm;
  const isCustom = slm.name === 'Custom';

  function row(label, children) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
        <span style={{ color: '#A8B8C8', fontSize: '13px', minWidth: '120px' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', background: '#13181F', borderRadius: '6px', border: '1px solid #1C2330' }}>
      <SectionHeader>Hardware Config</SectionHeader>

      {/* Preset */}
      {row(
        <Tooltip tooltipKey="preset">
          <span data-tooltip-key="preset">Preset</span>
        </Tooltip>,
        <Select.Root value={slm.name} onValueChange={(v) => selectPreset(slmId, v)}>
          <Select.Trigger data-testid="preset-select" style={selectStyle} aria-label="SLM preset">
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content style={{ background: '#1C2330', border: '1px solid #2a3344', borderRadius: '4px', zIndex: 9998 }}>
              <Select.Viewport>
                {presets.map((p) => (
                  <Select.Item
                    key={p.name}
                    value={p.name}
                    style={{ padding: '6px 12px', color: '#E8EDF3', fontSize: '13px', cursor: 'pointer' }}
                  >
                    <Select.ItemText>{p.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      )}

      {/* Resolution — editable only for Custom preset */}
      {row(
        <Tooltip tooltipKey="resolution">
          <span data-tooltip-key="resolution">Resolution</span>
        </Tooltip>,
        isCustom ? (
          <>
            <NumberInput
              data-testid="custom-res-x"
              value={hardware.resX}
              onChange={(v) => updateHardware(slmId, 'resX', Math.max(1, Math.round(v)))}
              min={1}
              max={7680}
              step={1}
              style={{ width: '65px' }}
              aria-label="Custom resolution width"
            />
            <span style={{ color: '#A8B8C8', fontSize: '13px' }}>×</span>
            <NumberInput
              data-testid="custom-res-y"
              value={hardware.resY}
              onChange={(v) => updateHardware(slmId, 'resY', Math.max(1, Math.round(v)))}
              min={1}
              max={7680}
              step={1}
              style={{ width: '65px' }}
              aria-label="Custom resolution height"
            />
          </>
        ) : (
          <span style={{ color: '#E8EDF3', fontSize: '13px' }}>
            {hardware.resX} × {hardware.resY}
          </span>
        )
      )}

      {/* Pixel pitch — editable only for Custom preset */}
      {row(
        <Tooltip tooltipKey="pixelPitch">
          <span data-testid="pixel-pitch-label" data-tooltip-key="pixelPitch">Pixel pitch</span>
        </Tooltip>,
        isCustom ? (
          <>
            <NumberInput
              data-testid="pixel-pitch-input"
              value={hardware.pixelPitchMicron}
              onChange={(v) => updateHardware(slmId, 'pixelPitchMicron', v)}
              min={0.1}
              max={200}
              step={0.1}
              style={{ flex: 1 }}
              aria-label="Pixel pitch in micrometres"
            />
            <UnitBadge unit="μm" />
          </>
        ) : (
          <>
            <span style={{ color: '#E8EDF3', fontSize: '13px', flex: 1 }}>{hardware.pixelPitchMicron}</span>
            <UnitBadge unit="μm" />
          </>
        )
      )}

      {/* Bit depth — editable only for Custom preset */}
      {row(
        <Tooltip tooltipKey="bitDepth">
          <span data-tooltip-key="bitDepth">Bit depth</span>
        </Tooltip>,
        isCustom ? (
          <Select.Root
            value={String(hardware.bitDepth)}
            onValueChange={(v) => updateHardware(slmId, 'bitDepth', Number(v))}
          >
            <Select.Trigger data-testid="bit-depth-select" style={selectStyle} aria-label="Bit depth">
              <Select.Value />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content style={{ background: '#1C2330', border: '1px solid #2a3344', borderRadius: '4px', zIndex: 9998 }}>
                <Select.Viewport>
                  {['8', '10'].map((v) => (
                    <Select.Item
                      key={v}
                      value={v}
                      style={{ padding: '6px 12px', color: '#E8EDF3', fontSize: '13px', cursor: 'pointer' }}
                    >
                      <Select.ItemText>{v}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        ) : (
          <span data-testid="bit-depth-select" style={{ color: '#E8EDF3', fontSize: '13px' }}>{hardware.bitDepth}</span>
        )
      )}
    </div>
  );
}

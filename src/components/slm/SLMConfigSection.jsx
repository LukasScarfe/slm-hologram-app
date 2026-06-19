import * as Select from '@radix-ui/react-select';
import { useSLMStore } from '../../store/useSLMStore.js';
import { Tooltip } from '../shared/Tooltip.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';
import { SectionHeader } from '../shared/SectionHeader.jsx';
import presets from '../../data/slmPresets.json';

const selectStyle = {
  background: '#1C2330',
  color: '#E8EDF3',
  border: '1px solid #2a3344',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '13px',
  minWidth: '160px',
  cursor: 'pointer',
};

export function SLMConfigSection({ slmId }) {
  const slm = useSLMStore((state) => state.slms.find((s) => s.id === slmId));
  const selectPreset = useSLMStore((state) => state.selectPreset);
  const updateHardware = useSLMStore((state) => state.updateHardware);
  const setGamma = useSLMStore((state) => state.setGamma);
  const setGratingFrequency = useSLMStore((state) => state.setGratingFrequency);

  if (!slm) return null;

  const { hardware, gamma, gratingFrequency } = slm;
  const maxGamma = Math.pow(2, hardware.bitDepth) - 1;
  const isCustom = slm.name === 'Custom';

  function row(label, children) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
        <span style={{ color: '#6B7A90', fontSize: '13px', minWidth: '120px' }}>{label}</span>
        {children}
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', background: '#13181F', borderRadius: '6px', border: '1px solid #1C2330' }}>
      <SectionHeader>Hardware Config</SectionHeader>

      {/* Preset selector */}
      {row(
        <Tooltip tooltipKey="preset">
          <span data-tooltip-key="preset">Preset</span>
        </Tooltip>,
        <Select.Root
          value={slm.name}
          onValueChange={(v) => selectPreset(slmId, v)}
        >
          <Select.Trigger
            data-testid="preset-select"
            style={selectStyle}
            aria-label="SLM preset"
          >
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              style={{ background: '#1C2330', border: '1px solid #2a3344', borderRadius: '4px', zIndex: 9998 }}
            >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NumberInput
              data-testid="custom-res-x"
              value={hardware.resX}
              onChange={(v) => updateHardware(slmId, 'resX', Math.max(1, Math.round(v)))}
              min={1}
              max={7680}
              step={1}
              style={{ width: '70px' }}
              aria-label="Custom resolution width"
            />
            <span style={{ color: '#6B7A90', fontSize: '13px' }}>×</span>
            <NumberInput
              data-testid="custom-res-y"
              value={hardware.resY}
              onChange={(v) => updateHardware(slmId, 'resY', Math.max(1, Math.round(v)))}
              min={1}
              max={7680}
              step={1}
              style={{ width: '70px' }}
              aria-label="Custom resolution height"
            />
          </div>
        ) : (
          <span style={{ color: '#E8EDF3', fontSize: '13px' }}>
            {hardware.resX} × {hardware.resY}
          </span>
        )
      )}

      {/* Pixel pitch — editable for all presets */}
      {row(
        <Tooltip tooltipKey="pixelPitch">
          <span data-testid="pixel-pitch-label" data-tooltip-key="pixelPitch">Pixel pitch (μm)</span>
        </Tooltip>,
        <NumberInput
          data-testid="pixel-pitch-input"
          value={hardware.pixelPitchMicron}
          onChange={(v) => updateHardware(slmId, 'pixelPitchMicron', v)}
          min={0.1}
          max={200}
          step={0.1}
          style={{ width: '80px' }}
          aria-label="Pixel pitch in micrometres"
        />
      )}

      {/* Wavelength — editable for all presets */}
      {row(
        <Tooltip tooltipKey="wavelength">
          <span data-testid="wavelength-label" data-tooltip-key="wavelength">Wavelength (nm)</span>
        </Tooltip>,
        <NumberInput
          data-testid="wavelength-input"
          value={hardware.wavelengthNm}
          onChange={(v) => updateHardware(slmId, 'wavelengthNm', v)}
          min={200}
          max={2000}
          step={1}
          style={{ width: '80px' }}
          aria-label="Wavelength in nanometres"
        />
      )}

      {/* Bit depth */}
      {row(
        <Tooltip tooltipKey="bitDepth">
          <span data-tooltip-key="bitDepth">Bit depth</span>
        </Tooltip>,
        <Select.Root
          value={String(hardware.bitDepth)}
          onValueChange={(v) => updateHardware(slmId, 'bitDepth', Number(v))}
        >
          <Select.Trigger
            data-testid="bit-depth-select"
            style={{ ...selectStyle, minWidth: '80px' }}
            aria-label="Bit depth"
          >
            <Select.Value />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              style={{ background: '#1C2330', border: '1px solid #2a3344', borderRadius: '4px', zIndex: 9998 }}
            >
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
      )}

      {/* Gamma */}
      {row(
        <Tooltip tooltipKey="gamma">
          <span data-testid="gamma-label" data-tooltip-key="gamma">Gamma (γ)</span>
        </Tooltip>,
        <NumberInput
          data-testid="gamma-input"
          value={gamma}
          onChange={(v) => setGamma(slmId, v)}
          min={1}
          max={maxGamma}
          step={1}
          aria-label="Gamma maximum grey level"
        />
      )}

      {/* Grating θx */}
      {row(
        <Tooltip tooltipKey="gratingFx">
          <span data-testid="grating-fx-label" data-tooltip-key="gratingFx">Grating θₓ (mrad)</span>
        </Tooltip>,
        <NumberInput
          data-testid="grating-fx"
          value={gratingFrequency.fx}
          onChange={(v) => setGratingFrequency(slmId, 'fx', v)}
          min={-60}
          max={60}
          step={0.1}
          style={{ width: '80px' }}
          aria-label="Grating angle theta x in milliradians"
        />
      )}

      {/* Grating θy */}
      {row(
        <Tooltip tooltipKey="gratingFy">
          <span data-tooltip-key="gratingFy">Grating θᵧ (mrad)</span>
        </Tooltip>,
        <NumberInput
          data-testid="grating-fy"
          value={gratingFrequency.fy}
          onChange={(v) => setGratingFrequency(slmId, 'fy', v)}
          min={-60}
          max={60}
          step={0.1}
          style={{ width: '80px' }}
          aria-label="Grating angle theta y in milliradians"
        />
      )}

    </div>
  );
}

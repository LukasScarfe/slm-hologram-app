import { useState } from 'react';
import { useSLMStore } from '../../store/useSLMStore.js';
import { NumberInput } from '../shared/NumberInput.jsx';
import { LabelledSlider } from '../shared/LabelledSlider.jsx';
import { SectionHeader } from '../shared/SectionHeader.jsx';
import { Tooltip } from '../shared/Tooltip.jsx';

// Speed of light: c = 299792.458 nm·THz
const C_NM_THZ = 299792.458;

const CONTROL_WIDTH = 136;

const toggleBtnStyle = {
  background: 'transparent',
  color: '#22c55e',
  border: '1px solid #22c55e',
  borderRadius: '4px',
  padding: '1px 5px',
  fontSize: '11px',
  lineHeight: '16px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  minWidth: '44px',
  textAlign: 'center',
};

function ToggleBtn({ value, onClick }) {
  return <button style={toggleBtnStyle} onClick={onClick}>{value}</button>;
}

export function HologramParamsSection({ slmId }) {
  const slm = useSLMStore((state) => state.slms.find((s) => s.id === slmId));
  const updateHardware = useSLMStore((state) => state.updateHardware);
  const setGamma = useSLMStore((state) => state.setGamma);
  const setGratingFrequency = useSLMStore((state) => state.setGratingFrequency);
  const setHoloShift = useSLMStore((state) => state.setHoloShift);

  const [waveUnit, setWaveUnit] = useState('nm');    // 'nm' | 'THz'
  const [gammaUnit, setGammaUnit] = useState('bit'); // 'bit' | '%'
  const [fxUnit, setFxUnit] = useState('mrad');      // 'mrad' | 'Hz'
  const [fyUnit, setFyUnit] = useState('mrad');      // 'mrad' | 'Hz'

  if (!slm) return null;

  const { hardware, gamma, gratingFrequency, holoShift } = slm;
  const maxGamma = Math.pow(2, hardware.bitDepth) - 1;
  const pitch_mm = hardware.pixelPitchMicron / 1000;

  // Wavelength: stored in nm
  const waveToDisplay = (nm) =>
    waveUnit === 'THz' ? parseFloat((C_NM_THZ / nm).toFixed(3)) : nm;
  const waveFromDisplay = (v) =>
    waveUnit === 'THz' ? C_NM_THZ / v : v;
  const waveMin = waveUnit === 'nm' ? 200 : parseFloat((C_NM_THZ / 2000).toFixed(3));
  const waveMax = waveUnit === 'nm' ? 2000 : parseFloat((C_NM_THZ / 200).toFixed(3));
  const waveStep = waveUnit === 'nm' ? 1 : 0.001;

  // Gamma: stored as integer grey level
  const gammaToDisplay = (b) =>
    gammaUnit === '%' ? parseFloat(((b / maxGamma) * 100).toFixed(2)) : b;
  const gammaFromDisplay = (v) =>
    gammaUnit === '%' ? Math.round((v / 100) * maxGamma) : v;
  const gammaMin = gammaUnit === 'bit' ? 1 : parseFloat(((1 / maxGamma) * 100).toFixed(2));
  const gammaMax = gammaUnit === 'bit' ? maxGamma : 100;
  const gammaStep = gammaUnit === 'bit' ? 1 : 0.1;

  // Grating: stored in mrad; Hz = cycles across screen
  // Hz_x = mrad * resX * pixelPitchMicron / wavelengthNm
  const fxToDisplay = (mrad) =>
    fxUnit === 'Hz'
      ? parseFloat((mrad * hardware.resX * hardware.pixelPitchMicron / hardware.wavelengthNm).toFixed(3))
      : mrad;
  const fxFromDisplay = (v) =>
    fxUnit === 'Hz'
      ? (v * hardware.wavelengthNm) / (hardware.resX * hardware.pixelPitchMicron)
      : v;

  const fyToDisplay = (mrad) =>
    fyUnit === 'Hz'
      ? parseFloat((mrad * hardware.resY * hardware.pixelPitchMicron / hardware.wavelengthNm).toFixed(3))
      : mrad;
  const fyFromDisplay = (v) =>
    fyUnit === 'Hz'
      ? (v * hardware.wavelengthNm) / (hardware.resY * hardware.pixelPitchMicron)
      : v;

  const fxStep = fxUnit === 'mrad' ? 0.1 : 0.01;
  const fyStep = fyUnit === 'mrad' ? 0.1 : 0.01;

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
      <SectionHeader>Hologram Parameters</SectionHeader>

      {/* Wavelength */}
      {row(
        <Tooltip tooltipKey="wavelength">
          <span data-tooltip-key="wavelength">Wavelength</span>
        </Tooltip>,
        <>
          <NumberInput
            data-testid="wavelength-input"
            value={waveToDisplay(hardware.wavelengthNm)}
            onChange={(v) => updateHardware(slmId, 'wavelengthNm', waveFromDisplay(v))}
            min={waveMin}
            max={waveMax}
            step={waveStep}
            style={{ flex: 1 }}
            aria-label="Wavelength"
          />
          <ToggleBtn
            value={waveUnit}
            onClick={() => setWaveUnit((u) => u === 'nm' ? 'THz' : 'nm')}
          />
        </>
      )}

      {/* Gamma */}
      {row(
        <Tooltip tooltipKey="gamma">
          <span data-testid="gamma-label" data-tooltip-key="gamma">Gamma (γ)</span>
        </Tooltip>,
        <>
          <NumberInput
            data-testid="gamma-input"
            value={gammaToDisplay(gamma)}
            onChange={(v) => setGamma(slmId, gammaFromDisplay(v))}
            min={gammaMin}
            max={gammaMax}
            step={gammaStep}
            style={{ flex: 1 }}
            aria-label="Gamma"
          />
          <ToggleBtn
            value={gammaUnit}
            onClick={() => setGammaUnit((u) => u === 'bit' ? '%' : 'bit')}
          />
        </>
      )}

      {/* Grating θx */}
      {row(
        <Tooltip tooltipKey="gratingFx">
          <span data-testid="grating-fx-label" data-tooltip-key="gratingFx">Grating θₓ</span>
        </Tooltip>,
        <>
          <NumberInput
            data-testid="grating-fx"
            value={fxToDisplay(gratingFrequency.fx)}
            onChange={(v) => setGratingFrequency(slmId, 'fx', fxFromDisplay(v))}
            step={fxStep}
            style={{ flex: 1 }}
            aria-label="Grating theta x"
          />
          <ToggleBtn
            value={fxUnit}
            onClick={() => setFxUnit((u) => u === 'mrad' ? 'Hz' : 'mrad')}
          />
        </>
      )}

      {/* Grating θy */}
      {row(
        <Tooltip tooltipKey="gratingFy">
          <span data-testid="grating-fy-label" data-tooltip-key="gratingFy">Grating θᵧ</span>
        </Tooltip>,
        <>
          <NumberInput
            data-testid="grating-fy"
            value={fyToDisplay(gratingFrequency.fy)}
            onChange={(v) => setGratingFrequency(slmId, 'fy', fyFromDisplay(v))}
            step={fyStep}
            style={{ flex: 1 }}
            aria-label="Grating theta y"
          />
          <ToggleBtn
            value={fyUnit}
            onClick={() => setFyUnit((u) => u === 'mrad' ? 'Hz' : 'mrad')}
          />
        </>
      )}

      {/* Hologram Shift */}
      <div style={{ marginTop: '8px' }}>
        <Tooltip tooltipKey="holoShift">
          <span style={{ color: '#A8B8C8', fontSize: '13px', cursor: 'default' }} data-tooltip-key="holoShift">
            Hologram Shift
          </span>
        </Tooltip>
        <LabelledSlider
          label="X"
          tooltipKey="holoShift"
          value={holoShift?.x ?? 0}
          onChange={(v) => setHoloShift(slmId, 'x', v)}
          min={-hardware.resX / 2}
          max={hardware.resX / 2}
          step={1}
          unlimitedInput
          enableUnitToggle
          pixelPitch={hardware.pixelPitchMicron}
          data-testid="holo-shift-x-slider"
          numberInputTestId="holo-shift-x-input"
          numberInputAriaLabel="Hologram shift X"
        />
        <LabelledSlider
          label="Y"
          tooltipKey="holoShift"
          value={holoShift?.y ?? 0}
          onChange={(v) => setHoloShift(slmId, 'y', v)}
          min={-hardware.resY / 2}
          max={hardware.resY / 2}
          step={1}
          unlimitedInput
          enableUnitToggle
          pixelPitch={hardware.pixelPitchMicron}
          data-testid="holo-shift-y-slider"
          numberInputTestId="holo-shift-y-input"
          numberInputAriaLabel="Hologram shift Y"
        />
      </div>
    </div>
  );
}

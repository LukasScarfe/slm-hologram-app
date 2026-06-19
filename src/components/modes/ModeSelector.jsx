import * as Select from '@radix-ui/react-select';
import { useSLMStore } from '../../store/useSLMStore.js';
import { lgDefaults } from './params/LGParams.jsx';
import { gaussianDefaults } from './params/GaussianParams.jsx';
import { hgDefaults } from './params/HGParams.jsx';
import { besselDefaults } from './params/BesselParams.jsx';
import { lensDefaults } from './params/LensParams.jsx';
import { zernikeDefaults } from './params/ZernikeParams.jsx';
import { airyDefaults } from './params/AiryParams.jsx';
import { customEquationDefaults } from './params/CustomEquationParams.jsx';
import { inceGaussianDefaults } from './params/InceGaussianParams.jsx';
import { matthieuDefaults } from './params/MatthieuParams.jsx';
import { parabolicalDefaults } from './params/ParabolicalParams.jsx';
import { vectorVortexDefaults } from './params/VectorVortexParams.jsx';
import { axiconDefaults } from './params/AxiconParams.jsx';
import { spiralPhaseDefaults } from './params/SpiralPhaseParams.jsx';

export const MODE_OPTIONS = [
  { value: 'gaussianBeam',    label: 'Gaussian',          defaults: gaussianDefaults },
  { value: 'laguerreGaussian',label: 'Laguerre-Gaussian', defaults: lgDefaults },
  { value: 'hermiteGaussian', label: 'Hermite-Gaussian',  defaults: hgDefaults },
  { value: 'besselBeam',      label: 'Bessel',            defaults: besselDefaults },
  { value: 'airyBeam',        label: 'Airy Beam',         defaults: airyDefaults },
  { value: 'inceGaussian',    label: 'Ince-Gaussian',     defaults: inceGaussianDefaults },
  { value: 'matthieuBeam',    label: 'Mathieu Beam',      defaults: matthieuDefaults },
  { value: 'parabolicalBeam', label: 'Parabolic Beam',    defaults: parabolicalDefaults },
  { value: 'vectorVortex',    label: 'Vector Vortex',     defaults: vectorVortexDefaults },
  { value: 'axicon',          label: 'Axicon',            defaults: axiconDefaults },
  { value: 'spiralPhase',     label: 'Spiral Phase',      defaults: spiralPhaseDefaults },
  { value: 'lens',            label: 'Lens',              defaults: lensDefaults },
  { value: 'zernikeModes',    label: 'Zernike',           defaults: zernikeDefaults },
  { value: 'customEquation',  label: 'Custom Equation',   defaults: customEquationDefaults },
];

const selectStyle = {
  background: '#1C2330',
  color: '#E8EDF3',
  border: '1px solid #00C9A7',
  borderRadius: '4px',
  padding: '6px 12px',
  fontSize: '13px',
  cursor: 'pointer',
  minWidth: '180px',
};

export function ModeSelector({ slmId }) {
  const addMode = useSLMStore((s) => s.addMode);

  function handleAdd(modeType) {
    const opt = MODE_OPTIONS.find((o) => o.value === modeType);
    addMode(slmId, { type: modeType, params: { ...opt?.defaults } });
  }

  return (
    <Select.Root onValueChange={handleAdd} value="">
      <Select.Trigger
        data-testid="add-mode-button"
        style={selectStyle}
        aria-label="Add mode"
      >
        <Select.Value placeholder="+ Add Mode" />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          style={{ background: '#1C2330', border: '1px solid #2a3344', borderRadius: '4px', zIndex: 9998, minWidth: '180px' }}
        >
          <Select.Viewport>
            {MODE_OPTIONS.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                style={{ padding: '8px 12px', color: '#E8EDF3', fontSize: '13px', cursor: 'pointer' }}
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

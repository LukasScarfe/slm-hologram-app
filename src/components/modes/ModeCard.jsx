import { useState, useRef, useEffect } from 'react';
import { useSLMStore } from '../../store/useSLMStore.js';
import { ModeWeightSlider } from './ModeWeightSlider.jsx';
import { GaussianParams } from './params/GaussianParams.jsx';
import { LGParams } from './params/LGParams.jsx';
import { HGParams } from './params/HGParams.jsx';
import { BesselParams } from './params/BesselParams.jsx';
import { LensParams } from './params/LensParams.jsx';
import { ZernikeParams } from './params/ZernikeParams.jsx';
import { AiryParams } from './params/AiryParams.jsx';
import { CustomEquationParams } from './params/CustomEquationParams.jsx';
import { InceGaussianParams } from './params/InceGaussianParams.jsx';
import { MatthieuParams } from './params/MatthieuParams.jsx';
import { ParabolicalParams } from './params/ParabolicalParams.jsx';
import { VectorVortexParams } from './params/VectorVortexParams.jsx';
import { AxiconParams } from './params/AxiconParams.jsx';
import { SpiralPhaseParams } from './params/SpiralPhaseParams.jsx';

const PARAM_COMPONENTS = {
  gaussianBeam:    GaussianParams,
  laguerreGaussian:LGParams,
  hermiteGaussian: HGParams,
  besselBeam:      BesselParams,
  lens:            LensParams,
  zernikeModes:    ZernikeParams,
  airyBeam:        AiryParams,
  customEquation:  CustomEquationParams,
  inceGaussian:    InceGaussianParams,
  matthieuBeam:    MatthieuParams,
  parabolicalBeam: ParabolicalParams,
  vectorVortex:    VectorVortexParams,
  axicon:          AxiconParams,
  spiralPhase:     SpiralPhaseParams,
};

const TYPE_LABELS = {
  gaussianBeam:    'Gaussian',
  laguerreGaussian:'LG',
  hermiteGaussian: 'HG',
  besselBeam:      'Bessel',
  lens:            'Lens',
  zernikeModes:    'Zernike',
  airyBeam:        'Airy',
  customEquation:  'Custom',
  inceGaussian:    'Ince-G',
  matthieuBeam:    'Mathieu',
  parabolicalBeam: 'Parabolic',
  vectorVortex:    'Vector V.',
  axicon:          'Axicon',
  spiralPhase:     'Spiral',
};

function ModeTitle({ slmId, modeIndex, typeLabel, nickname }) {
  const setModeNickname = useSLMStore((s) => s.setModeNickname);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft(nickname || '');
      inputRef.current?.select();
    }
  }, [editing, nickname]);

  function commit() {
    setModeNickname(slmId, modeIndex, draft.trim());
    setEditing(false);
  }

  const display = nickname || typeLabel;

  if (editing) {
    return (
      <input
        ref={inputRef}
        data-testid={`mode-nickname-input-${modeIndex}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder={typeLabel}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #22c55e',
          color: '#E8EDF3',
          fontSize: '13px',
          fontWeight: 600,
          outline: 'none',
          flex: 1,
          minWidth: 0,
          padding: 0,
        }}
        autoFocus
      />
    );
  }

  return (
    <span
      data-testid={`mode-title-${modeIndex}`}
      style={{ color: '#E8EDF3', fontSize: '13px', fontWeight: 600, flex: 1, cursor: 'text' }}
      title={nickname ? typeLabel : 'Double-click to add nickname'}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
    >
      {display}
      {nickname && (
        <span style={{ color: '#A8B8C8', fontWeight: 400, fontSize: '11px', marginLeft: '6px' }}>
          {typeLabel}
        </span>
      )}
    </span>
  );
}

export function ModeCard({ slmId, modeIndex, mode }) {
  const [expanded, setExpanded] = useState(true);
  const removeMode = useSLMStore((s) => s.removeMode);
  const toggleModeEnabled = useSLMStore((s) => s.toggleModeEnabled);

  const ParamsComp = PARAM_COMPONENTS[mode.type];

  return (
    <div
      data-testid={`mode-card-${modeIndex}`}
      style={{
        background: '#13181F',
        border: '1px solid #1C2330',
        borderRadius: '6px',
        marginBottom: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          background: mode.enabled ? '#13181F' : '#0d1117',
        }}
      >
        <input
          type="checkbox"
          checked={mode.enabled}
          onChange={() => toggleModeEnabled(slmId, modeIndex)}
          data-testid={`mode-enable-${modeIndex}`}
          aria-label={`Enable mode ${modeIndex}`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => e.stopPropagation()}
        />
        <ModeTitle
          slmId={slmId}
          modeIndex={modeIndex}
          typeLabel={TYPE_LABELS[mode.type] ?? mode.type}
          nickname={mode.nickname || ''}
        />
        <button
          onClick={() => removeMode(slmId, modeIndex)}
          aria-label={`Remove mode ${modeIndex}`}
          style={{
            background: 'none',
            border: 'none',
            color: '#A8B8C8',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          ×
        </button>
        <span
          onClick={() => setExpanded((x) => !x)}
          style={{ color: '#A8B8C8', fontSize: '12px', cursor: 'pointer' }}
        >
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #1C2330' }}>
          {ParamsComp && (
            <ParamsComp slmId={slmId} modeIndex={modeIndex} params={mode.params} />
          )}
          <div style={{ marginTop: '8px', borderTop: '1px solid #1C2330', paddingTop: '8px' }}>
            <ModeWeightSlider
              slmId={slmId}
              modeIndex={modeIndex}
              weight={mode.weight}
              phaseOffset={mode.phaseOffset}
            />
          </div>
        </div>
      )}
    </div>
  );
}

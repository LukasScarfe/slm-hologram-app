import { useRef, useEffect, useState } from 'react';
import { useHologramCompute } from '../../hooks/useHologramCompute.js';
import { useSLMStore } from '../../store/useSLMStore.js';
import { CET_C6 } from '../../data/cetC6.js';

const VIEW_MODES = [
  { key: 'hologram',  label: 'Hologram' },
  { key: 'field',     label: 'Field' },
  { key: 'intensity', label: 'Intensity' },
  { key: 'phase',     label: 'Phase' },
];

// Views that use the phase colormap toggle
const PHASE_VIEWS = new Set(['phase', 'field']);

// Rainbow from +π (top) → −π (bottom)
const RAINBOW_V = [
  'hsl(360,100%,50%)',
  'hsl(300,100%,50%)',
  'hsl(240,100%,50%)',
  'hsl(180,100%,50%)',
  'hsl(120,100%,50%)',
  'hsl(60,100%,50%)',
  'hsl(0,100%,50%)',
].join(', ');

// Sample CET_C6 at N evenly-spaced stops from entry 255 (top = +π) down to entry 0 (bottom = −π)
function cetC6GradientCSS(numStops = 24) {
  const stops = [];
  for (let i = 0; i <= numStops; i++) {
    const entry = Math.round(255 * (1 - i / numStops));
    const idx = entry * 3;
    stops.push(`rgb(${CET_C6[idx]},${CET_C6[idx + 1]},${CET_C6[idx + 2]})`);
  }
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

const CET_C6_GRADIENT = cetC6GradientCSS();

const LEGEND_CONFIG = {
  hologram:  { gradient: 'linear-gradient(to bottom, #fff, #000)', top: '2π', bottom: '0',  title: 'Encoded grey level (0 → 2π)' },
  field:     {
    hsv:    { gradient: `linear-gradient(to bottom, ${RAINBOW_V})`, title: 'Hue = phase (HSV) · brightness = intensity' },
    cet_c6: { gradient: CET_C6_GRADIENT, title: 'Hue = phase (CET_C6) · brightness = intensity' },
  },
  intensity: { gradient: 'linear-gradient(to bottom, #fff, #000)', top: '1',  bottom: '0',  title: 'Normalised intensity A²' },
  phase:     {
    hsv:    { gradient: `linear-gradient(to bottom, ${RAINBOW_V})`, title: 'Phase Φ ∈ [−π, +π] (HSV)' },
    cet_c6: { gradient: CET_C6_GRADIENT, title: 'Phase Φ ∈ [−π, +π] (CET_C6)' },
  },
};

export function SLMPreview({ slmId }) {
  const canvasRef = useRef(null);
  const slm = useSLMStore((state) => state.slms.find((s) => s.id === slmId));
  const setPhaseColormap = useSLMStore((s) => s.setPhaseColormap);
  const [viewMode, setViewMode] = useState('hologram');

  useHologramCompute(slmId, canvasRef, viewMode);

  const isImported     = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.isImported);
  const importedPixels = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.importedPixels);
  const importedWidth  = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.importedWidth);
  const importedHeight = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.importedHeight);
  const phaseColormap  = slm?.phaseColormap ?? 'hsv';

  useEffect(() => {
    if (!isImported || !importedPixels || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = importedWidth;
    canvas.height = importedHeight;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(importedPixels), importedWidth, importedHeight),
      0, 0
    );
  }, [isImported, importedPixels, importedWidth, importedHeight]);

  const resX = isImported ? (importedWidth  ?? slm?.hardware?.resX ?? 1920) : (slm?.hardware?.resX ?? 1920);
  const resY = isImported ? (importedHeight ?? slm?.hardware?.resY ?? 1080) : (slm?.hardware?.resY ?? 1080);

  const btnBase = {
    padding: '3px 10px',
    fontSize: '11px',
    fontFamily: 'inherit',
    borderRadius: '4px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  };

  // Resolve legend config for current view + colormap
  let gradient, top, bottom, legendTitle;
  const rawConfig = LEGEND_CONFIG[viewMode];
  if (rawConfig && (viewMode === 'phase' || viewMode === 'field')) {
    const cm = rawConfig[phaseColormap] ?? rawConfig.hsv;
    gradient = cm.gradient;
    legendTitle = cm.title;
    top = '+π';
    bottom = '−π';
  } else if (rawConfig) {
    gradient = rawConfig.gradient;
    top = rawConfig.top;
    bottom = rawConfig.bottom;
    legendTitle = rawConfig.title;
  }

  const showColormapToggle = !isImported && PHASE_VIEWS.has(viewMode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* View mode toggle — hidden when an imported hologram is active */}
      {!isImported && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          {VIEW_MODES.map(({ key, label }) => {
            const active = viewMode === key;
            return (
              <button
                key={key}
                data-testid={`preview-mode-${key}`}
                aria-pressed={active}
                onClick={() => setViewMode(key)}
                style={{
                  ...btnBase,
                  borderColor:  active ? '#22c55e' : '#1C2330',
                  background:   active ? 'rgba(34,197,94,0.12)' : 'transparent',
                  color:        active ? '#22c55e' : '#A8B8C8',
                }}
              >
                {label}
              </button>
            );
          })}

          {/* Colormap toggle — only shown for Phase / Field views */}
          {showColormapToggle && (
            <div style={{ display: 'flex', gap: '2px', marginLeft: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#606878', marginRight: '4px' }}>cmap:</span>
              {[
                { id: 'cet_c6', label: 'CET C06' },
                { id: 'hsv',    label: 'HSV' },
              ].map(({ id, label }) => {
                const active = phaseColormap === id;
                return (
                  <button
                    key={id}
                    data-testid={`colormap-${id}`}
                    aria-pressed={active}
                    onClick={() => setPhaseColormap(slmId, id)}
                    style={{
                      ...btnBase,
                      padding: '2px 8px',
                      borderColor:  active ? '#22c55e' : '#1C2330',
                      background:   active ? 'rgba(34,197,94,0.12)' : 'transparent',
                      color:        active ? '#22c55e' : '#A8B8C8',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Canvas + vertical colour legend — legend hidden when imported */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'stretch' }}>
        {/* Resizable wrapper */}
        <div
          style={{
            resize: 'horizontal',
            overflow: 'hidden',
            flex: '1 1 auto',
            maxWidth: '720px',
            minWidth: '120px',
            aspectRatio: `${resX} / ${resY}`,
            borderRadius: '6px',
            border: '1px solid #1C2330',
            background: '#0B0E14',
          }}
        >
          <canvas
            ref={canvasRef}
            data-testid={`hologram-preview-${slmId}`}
            role="img"
            aria-label={`Hologram preview for ${slm?.name ?? slmId}`}
            width={400}
            height={225}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              imageRendering: 'pixelated',
            }}
          />
        </div>

        {/* Vertical legend */}
        {!isImported && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              color: '#A8B8C8',
              minWidth: '24px',
            }}
          >
            <span style={{ lineHeight: 1 }}>{top}</span>
            <div
              data-testid="preview-legend-bar"
              data-mode={viewMode}
              data-colormap={phaseColormap}
              title={legendTitle}
              style={{
                flex: 1,
                width: '12px',
                background: gradient,
                borderRadius: '2px',
              }}
            />
            <span style={{ lineHeight: 1 }}>{bottom}</span>
          </div>
        )}
      </div>
    </div>
  );
}

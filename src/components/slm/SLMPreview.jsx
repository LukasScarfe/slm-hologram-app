import { useRef, useEffect, useState } from 'react';
import { useHologramCompute } from '../../hooks/useHologramCompute.js';
import { useSLMStore } from '../../store/useSLMStore.js';

const VIEW_MODES = [
  { key: 'hologram',  label: 'Hologram' },
  { key: 'field',     label: 'Field' },
  { key: 'intensity', label: 'Intensity' },
  { key: 'phase',     label: 'Phase' },
];

// Rainbow from +π (top) → −π (bottom): hsl(360°) red → cyan → hsl(0°) red
const RAINBOW_V = [
  'hsl(360,100%,50%)',
  'hsl(300,100%,50%)',
  'hsl(240,100%,50%)',
  'hsl(180,100%,50%)',
  'hsl(120,100%,50%)',
  'hsl(60,100%,50%)',
  'hsl(0,100%,50%)',
].join(', ');

const LEGEND_CONFIG = {
  hologram:  { gradient: 'linear-gradient(to bottom, #fff, #000)', top: '2π', bottom: '0',  title: 'Encoded grey level (0 → 2π)' },
  field:     { gradient: `linear-gradient(to bottom, ${RAINBOW_V})`, top: '+π', bottom: '−π', title: 'Hue = phase · brightness = intensity' },
  intensity: { gradient: 'linear-gradient(to bottom, #fff, #000)', top: '1',  bottom: '0',  title: 'Normalised intensity A²' },
  phase:     { gradient: `linear-gradient(to bottom, ${RAINBOW_V})`, top: '+π', bottom: '−π', title: 'Phase Φ ∈ [−π, +π]' },
};

export function SLMPreview({ slmId }) {
  const canvasRef = useRef(null);
  const slm = useSLMStore((state) => state.slms.find((s) => s.id === slmId));
  const [viewMode, setViewMode] = useState('hologram');

  useHologramCompute(slmId, canvasRef, viewMode);

  // Draw imported hologram directly when isImported is true
  const isImported     = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.isImported);
  const importedPixels = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.importedPixels);
  const importedWidth  = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.importedWidth);
  const importedHeight = useSLMStore((s) => s.slms.find((x) => x.id === slmId)?.importedHeight);

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

  // Aspect ratio follows actual SLM pixels (or imported image dimensions).
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

  const { gradient, top, bottom, title } = LEGEND_CONFIG[viewMode];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* View mode toggle — hidden when an imported hologram is active */}
      {!isImported && (
        <div style={{ display: 'flex', gap: '4px' }}>
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
        </div>
      )}

      {/* Canvas + vertical colour legend — legend hidden when imported */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'stretch' }}>
        {/* Resizable wrapper — drag right edge; height follows pixel aspect ratio */}
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

        {/* Vertical legend — stretches to match canvas height */}
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
              title={title}
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

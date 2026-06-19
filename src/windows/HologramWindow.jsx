import { useRef, useEffect, useState, useCallback } from 'react';
import { WorkerQueue } from '../workers/WorkerQueue.js';

export function HologramWindow({ slmId }) {
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const [dims, setDims] = useState({ resX: 1920, resY: 1080 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el).catch(() => {});
  }, []);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    // Any keydown in the popup triggers fullscreen — user doesn't need to see/click it,
    // just focus the popup from the main window and press any key.
    function onKeyDown() { enterFullscreen(); }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);

    // Close this window if the opener (main app) navigates away or closes
    const openerPoll = setInterval(() => {
      if (!window.opener || window.opener.closed) {
        window.close();
      }
    }, 1000);

    const worker = new Worker(
      new URL('../workers/hologramWorker.js', import.meta.url),
      { type: 'module' }
    );

    const queue = new WorkerQueue(worker, (e) => {
      const { type, payload } = e.data;
      if (type === 'RESULT' && payload.slmId === slmId) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(payload.pixels, payload.width, payload.height);
        ctx.putImageData(imageData, 0, 0);
      }
    }, 10);

    workerRef.current = queue;

    function onMessage(evt) {
      if (!evt.data || evt.data.type !== 'SLM_PARAMS') return;
      const { payload } = evt.data;
      if (payload.slmId !== slmId) return;

      setDims({ resX: payload.hardware.resX, resY: payload.hardware.resY });
      queue.post({
        type: 'COMPUTE',
        payload: { ...payload, fullResolution: true, computeAllViews: false },
      });
    }

    window.addEventListener('message', onMessage);

    // Signal readiness to the opener so it sends current SLM params
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'DISPLAY_READY', slmId }, '*');
      } catch {
        // opener may be closed
      }
    }

    return () => {
      clearInterval(openerPoll);
      queue.terminate();
      window.removeEventListener('message', onMessage);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [slmId, enterFullscreen]);

  return (
    <div
      style={{
        background: '#000',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="hologram-canvas"
        width={dims.resX}
        height={dims.resY}
        style={{ maxWidth: '100%', maxHeight: '100%', imageRendering: 'pixelated' }}
      />

      {/* Fullscreen prompt — dismissed on click, which is the required user gesture */}
      {!isFullscreen && (
        <div
          onClick={enterFullscreen}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.55)',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <span style={{
            color: '#E8EDF3',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            Click or press any key to enter fullscreen
          </span>
          <span style={{
            color: '#6B7A90',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
          }}>
            Use "Activate Fullscreen" in the main window if you cannot see this display
          </span>
        </div>
      )}
    </div>
  );
}

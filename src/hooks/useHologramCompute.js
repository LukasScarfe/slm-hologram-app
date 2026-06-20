import { useEffect, useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSLMStore } from '../store/useSLMStore.js';
import { WorkerQueue } from '../workers/WorkerQueue.js';

const DEBOUNCE_MS = 30;

function computeParamsSelector(slmId) {
  return (state) => {
    const s = state.slms.find((sl) => sl.id === slmId);
    if (!s) return null;
    return {
      modes: s.modes,
      hardware: s.hardware,
      encodingMethod: s.encodingMethod,
      gamma: s.gamma,
      gratingFrequency: s.gratingFrequency,
      holoShift: s.holoShift,
      isImported: s.isImported,
    };
  };
}

function drawToCanvas(canvas, pixels, width, height) {
  if (!canvas || !pixels) return;
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);
}

export function useHologramCompute(slmId, canvasRef, viewMode = 'hologram') {
  const workerRef  = useRef(null);
  const timerRef   = useRef(null);
  const pendingRef = useRef(null);
  // Cached result from the most recent successful compute
  const latestRef  = useRef(null); // { hologram, intensity, phase, width, height }
  // Ref copy of viewMode so the worker callback always reads the current value
  const viewModeRef = useRef(viewMode);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

  const slm = useSLMStore(useShallow(computeParamsSelector(slmId)));

  const triggerCompute = useCallback(() => {
    if (!slm || !workerRef.current) return;
    if (slm.isImported) return;
    pendingRef.current = {
      type: 'COMPUTE',
      payload: {
        slmId,
        modes: slm.modes,
        hardware: slm.hardware,
        encodingMethod: slm.encodingMethod,
        gamma: slm.gamma,
        gratingFrequency: slm.gratingFrequency,
        holoShift: slm.holoShift,
        computeAllViews: true,
      },
    };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (pendingRef.current && workerRef.current) {
        workerRef.current.post(pendingRef.current);
        pendingRef.current = null;
      }
    }, DEBOUNCE_MS);
  }, [slm, slmId]);

  // Create worker on mount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/hologramWorker.js', import.meta.url),
      { type: 'module' }
    );

    const queue = new WorkerQueue(worker, (e) => {
      const { type, payload } = e.data;
      if (type === 'RESULT' && payload.slmId === slmId) {
        // Cache all views
        latestRef.current = {
          hologram:  payload.pixels,
          intensity: payload.intensityPixels,
          phase:     payload.phasePixels,
          field:     payload.fieldPixels,
          width:     payload.width,
          height:    payload.height,
        };
        // Draw whichever view is currently selected
        const mode = viewModeRef.current;
        const pixels = mode === 'intensity' ? payload.intensityPixels
          : mode === 'phase'  ? payload.phasePixels
          : mode === 'field'  ? payload.fieldPixels
          : payload.pixels;
        drawToCanvas(canvasRef.current, pixels, payload.width, payload.height);
        // Store grey levels for export
        const { setHologramGreyData } = useSLMStore.getState();
        setHologramGreyData(slmId, payload.grey, payload.width, payload.height);
      }
    }, 10);

    workerRef.current = queue;
    return () => {
      queue.terminate();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [slmId, canvasRef]);

  // Redraw from cache when the user switches view mode (no recompute needed)
  useEffect(() => {
    if (!latestRef.current) return;
    const { hologram, intensity, phase, field, width, height } = latestRef.current;
    const pixels = viewMode === 'intensity' ? intensity
      : viewMode === 'phase'  ? phase
      : viewMode === 'field'  ? field
      : hologram;
    drawToCanvas(canvasRef.current, pixels, width, height);
  }, [viewMode, canvasRef]);

  // Trigger recompute whenever SLM state changes
  useEffect(() => {
    triggerCompute();
  }, [triggerCompute]);

  return { triggerCompute };
}

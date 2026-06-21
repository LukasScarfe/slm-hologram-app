import { encode as encodePNG } from 'fast-png';

// Spawn a one-shot worker to compute a full-resolution hologram for the given SLM state.
// Returns { grey, fieldPixels, intensityPixels, phasePixels, width, height }.
export function computeFullRes(slm) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./hologramWorker.js', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'RESULT') {
        worker.terminate();
        resolve({
          grey:            payload.grey,
          fieldPixels:     payload.fieldPixels,
          intensityPixels: payload.intensityPixels,
          phasePixels:     payload.phasePixels,
          width:           payload.width,
          height:          payload.height,
        });
      } else if (type === 'ERROR') {
        worker.terminate();
        reject(new Error(payload.error));
      }
    };
    worker.onerror = (err) => { worker.terminate(); reject(err); };
    worker.postMessage({
      type: 'COMPUTE',
      payload: {
        slmId:           slm.id,
        modes:           slm.modes,
        hardware:        slm.hardware,
        encodingMethod:  slm.encodingMethod,
        gamma:           slm.gamma,
        gratingFrequency: slm.gratingFrequency,
        holoShift:       slm.holoShift,
        phaseColormap:   slm.phaseColormap ?? 'cet_c6',
        fullResolution:  true,
        computeAllViews: true,
      },
    });
  });
}

// Encode an RGBA Uint8ClampedArray as a PNG and return an ArrayBuffer.
export function rgbaToPNG(rgba, width, height) {
  const result = encodePNG({ width, height, data: new Uint8Array(rgba), depth: 8, channels: 4 });
  return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
}

import { describe, it, expect, beforeEach } from 'vitest';

// We import the store module fresh per test by resetting it
// Zustand stores are module-level singletons, so we need to reset state between tests

let store;

beforeEach(async () => {
  // Dynamically import and reset between tests
  const mod = await import('../../src/store/useSLMStore.js');
  store = mod.useSLMStore;
  // Reset to initial state
  store.setState({
    slms: [
      {
        id: 'slm-1',
        name: 'Holoeye PLUTO-2.1',
        hardware: {
          resX: 1920,
          resY: 1080,
          pixelPitchMicron: 8.0,
          bitDepth: 8,
          wavelengthNm: 532,
          screenId: null,
        },
        gratingFrequency: { fx: 0, fy: 0 },
        gamma: 255,
        encodingMethod: 'exact',
        modes: [],
        hologramImageData: null,
        windowRef: null,
      },
    ],
    activeSLMId: 'slm-1',
  });
});

describe('useSLMStore', () => {
  it('1. initialises with one SLM matching Holoeye PLUTO-2.1 defaults', () => {
    const { slms } = store.getState();
    expect(slms).toHaveLength(1);
    const slm = slms[0];
    expect(slm.hardware.resX).toBe(1920);
    expect(slm.hardware.resY).toBe(1080);
    expect(slm.hardware.pixelPitchMicron).toBe(8.0);
    expect(slm.hardware.bitDepth).toBe(8);
    expect(slm.name).toBe('Holoeye PLUTO-2.1');
  });

  it('2. addMode appends with enabled:true, weight:1.0, phaseOffset:0', () => {
    const { addMode } = store.getState();
    addMode('slm-1', { type: 'laguerreGaussian', params: { l: 1, p: 0, w0: 100 } });
    const { slms } = store.getState();
    expect(slms[0].modes).toHaveLength(1);
    const mode = slms[0].modes[0];
    expect(mode.enabled).toBe(true);
    expect(mode.weight).toBe(1.0);
    expect(mode.phaseOffset).toBe(0);
    expect(mode.type).toBe('laguerreGaussian');
    expect(mode.params.l).toBe(1);
  });

  it('3. updateModeParam updates params.l without mutating other fields', () => {
    const { addMode, updateModeParam } = store.getState();
    addMode('slm-1', { type: 'laguerreGaussian', params: { l: 1, p: 0, w0: 100 } });
    updateModeParam('slm-1', 0, 'l', 3);
    const { slms } = store.getState();
    const mode = slms[0].modes[0];
    expect(mode.params.l).toBe(3);
    expect(mode.params.p).toBe(0);
    expect(mode.params.w0).toBe(100);
    expect(mode.weight).toBe(1.0);
    expect(mode.enabled).toBe(true);
  });

  it('4. removeMode on single mode results in 0 modes', () => {
    const { addMode, removeMode } = store.getState();
    addMode('slm-1', { type: 'laguerreGaussian', params: { l: 1, p: 0, w0: 100 } });
    removeMode('slm-1', 0);
    const { slms } = store.getState();
    expect(slms[0].modes).toHaveLength(0);
  });

  it('5. selectPreset "Meadowlark 1920" updates resX=1920, resY=1152', () => {
    const { selectPreset } = store.getState();
    selectPreset('slm-1', 'Meadowlark 1920');
    const { slms } = store.getState();
    expect(slms[0].hardware.resX).toBe(1920);
    expect(slms[0].hardware.resY).toBe(1152);
  });

  it('6. bitDepth can be set to 10 and persists', () => {
    const { updateHardware } = store.getState();
    updateHardware('slm-1', 'bitDepth', 10);
    const { slms } = store.getState();
    expect(slms[0].hardware.bitDepth).toBe(10);
  });

  it('7. gamma initialises to 255 for 8-bit, 1023 for 10-bit', () => {
    const { slms } = store.getState();
    expect(slms[0].gamma).toBe(255);

    // Add a 10-bit SLM by selecting Meadowlark 512 preset
    const { selectPreset } = store.getState();
    selectPreset('slm-1', 'Meadowlark 512');
    const updated = store.getState().slms[0];
    expect(updated.hardware.bitDepth).toBe(10);
    expect(updated.gamma).toBe(1023);
  });

  it('8. setGamma clamps: 200 → 200; 9999 → 255; 0 → 1', () => {
    const { setGamma } = store.getState();

    setGamma('slm-1', 200);
    expect(store.getState().slms[0].gamma).toBe(200);

    setGamma('slm-1', 9999);
    expect(store.getState().slms[0].gamma).toBe(255);

    setGamma('slm-1', 0);
    expect(store.getState().slms[0].gamma).toBe(1);
  });

  it('9. updateModeWeight sets weight without affecting other mode fields', () => {
    const { addMode, updateModeWeight } = store.getState();
    addMode('slm-1', { type: 'laguerreGaussian', params: { l: 1, p: 0, w0: 100 } });
    updateModeWeight('slm-1', 0, 0.5);
    const mode = store.getState().slms[0].modes[0];
    expect(mode.weight).toBe(0.5);
    expect(mode.params.l).toBe(1);
    expect(mode.enabled).toBe(true);
  });

  it('10. updateModePhaseOffset sets phaseOffset to Math.PI (±1e-10)', () => {
    const { addMode, updateModePhaseOffset } = store.getState();
    addMode('slm-1', { type: 'laguerreGaussian', params: { l: 1, p: 0, w0: 100 } });
    updateModePhaseOffset('slm-1', 0, Math.PI);
    const mode = store.getState().slms[0].modes[0];
    expect(Math.abs(mode.phaseOffset - Math.PI)).toBeLessThan(1e-10);
  });

  it('11. encodingMethod is always "exact" (encoding choice removed from UI)', () => {
    const { slms } = store.getState();
    expect(slms[0].encodingMethod).toBe('exact');
  });
});

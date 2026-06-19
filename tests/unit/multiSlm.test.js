import { describe, it, expect, beforeEach } from 'vitest';

let store;

beforeEach(async () => {
  const mod = await import('../../src/store/useSLMStore.js');
  store = mod.useSLMStore;
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

describe('multi-SLM store', () => {
  it('1. addSLM appends; after two calls slms.length === 3', () => {
    const { addSLM } = store.getState();
    addSLM();
    addSLM();
    expect(store.getState().slms).toHaveLength(3);
  });

  it('2. removeSLM removes only the targeted SLM; others unaffected', () => {
    const { addSLM, removeSLM } = store.getState();
    const id2 = addSLM();
    const id3 = addSLM();
    removeSLM(id2);
    const { slms } = store.getState();
    expect(slms).toHaveLength(2);
    expect(slms.find((s) => s.id === id2)).toBeUndefined();
    expect(slms.find((s) => s.id === 'slm-1')).toBeDefined();
    expect(slms.find((s) => s.id === id3)).toBeDefined();
  });

  it('3. addMode on SLM 2 appends only to slms[1].modes; slms[0].modes unchanged', () => {
    const { addSLM, addMode } = store.getState();
    const id2 = addSLM();
    addMode(id2, { type: 'laguerreGaussian', params: { l: 1, p: 0, w0: 100 } });
    const { slms } = store.getState();
    expect(slms[1].modes).toHaveLength(1);
    expect(slms[0].modes).toHaveLength(0);
  });

  it('4. updateModeParam on SLM 1 mode 0 does not affect SLM 2 mode 0', () => {
    const { addSLM, addMode, updateModeParam } = store.getState();
    const id2 = addSLM();
    addMode('slm-1', { type: 'laguerreGaussian', params: { l: 1, p: 0, w0: 100 } });
    addMode(id2, { type: 'laguerreGaussian', params: { l: 2, p: 0, w0: 100 } });
    updateModeParam('slm-1', 0, 'l', 5);
    const { slms } = store.getState();
    expect(slms[0].modes[0].params.l).toBe(5);
    expect(slms[1].modes[0].params.l).toBe(2);
  });

  it('5. Each SLM has independent hardware — mutating SLM 1 resX does not change SLM 2 resX', () => {
    const { addSLM, updateHardware } = store.getState();
    addSLM();
    updateHardware('slm-1', 'resX', 512);
    const { slms } = store.getState();
    expect(slms[0].hardware.resX).toBe(512);
    expect(slms[1].hardware.resX).toBe(1920);
  });

  it('6. activeSLMId changes when setActiveSLM is called', () => {
    const { addSLM, setActiveSLM } = store.getState();
    const id2 = addSLM();
    expect(store.getState().activeSLMId).toBe('slm-1');
    setActiveSLM(id2);
    expect(store.getState().activeSLMId).toBe(id2);
  });
});

import { create } from 'zustand';
import presets from '../data/slmPresets.json';

const PLUTO_PRESET = presets.find((p) => p.name === 'Holoeye PLUTO-2.1');

function defaultGamma(bitDepth) {
  return Math.pow(2, bitDepth) - 1;
}

function clampGamma(gamma, bitDepth) {
  const max = Math.pow(2, bitDepth) - 1;
  return Math.max(1, Math.min(max, Math.round(gamma)));
}

function makeSLM(id, preset) {
  const p = preset || PLUTO_PRESET;
  return {
    id,
    name: p.name,
    hardware: {
      resX: p.resX,
      resY: p.resY,
      pixelPitchMicron: p.pixelPitchMicron,
      bitDepth: p.bitDepth,
      wavelengthNm: p.wavelengthNm,
      screenId: null,
    },
    gratingFrequency: { fx: 0, fy: 0 },
    gamma: defaultGamma(p.bitDepth),
    encodingMethod: 'exact',
    modes: [],
    hologramImageData: null,
    windowRef: null,
    greyLevels: null,
    greyWidth: null,
    greyHeight: null,
    importedPixels: null,
    importedWidth: null,
    importedHeight: null,
    isImported: false,
  };
}

let nextSLMId = 2;

export const useSLMStore = create((set, get) => ({
  slms: [makeSLM('slm-1')],
  activeSLMId: 'slm-1',

  setActiveSLM: (id) => set({ activeSLMId: id }),

  addSLM: () => {
    const id = `slm-${nextSLMId++}`;
    set((state) => ({ slms: [...state.slms, makeSLM(id)] }));
    return id;
  },

  removeSLM: (slmId) =>
    set((state) => {
      const remaining = state.slms.filter((s) => s.id !== slmId);
      const newActive =
        state.activeSLMId === slmId
          ? (remaining[0]?.id ?? null)
          : state.activeSLMId;
      return { slms: remaining, activeSLMId: newActive };
    }),

  selectPreset: (slmId, presetName) =>
    set((state) => {
      const preset = presets.find((p) => p.name === presetName);
      if (!preset) return state;
      return {
        slms: state.slms.map((s) =>
          s.id !== slmId
            ? s
            : {
                ...s,
                name: preset.name,
                hardware: {
                  ...s.hardware,
                  resX: preset.resX,
                  resY: preset.resY,
                  pixelPitchMicron: preset.pixelPitchMicron,
                  bitDepth: preset.bitDepth,
                  wavelengthNm: preset.wavelengthNm,
                },
                gamma: defaultGamma(preset.bitDepth),
              }
        ),
      };
    }),

  updateHardware: (slmId, field, value) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        const newHardware = { ...s.hardware, [field]: value };
        // If bitDepth changed, clamp gamma
        const newGamma =
          field === 'bitDepth'
            ? clampGamma(s.gamma, value)
            : s.gamma;
        return { ...s, hardware: newHardware, gamma: newGamma };
      }),
    })),

  setGamma: (slmId, value) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        return { ...s, gamma: clampGamma(value, s.hardware.bitDepth) };
      }),
    })),

  setEncodingMethod: (slmId, method) =>
    set((state) => {
      if (method !== 'exact' && method !== 'approximate') return state;
      return {
        slms: state.slms.map((s) =>
          s.id !== slmId ? s : { ...s, encodingMethod: method }
        ),
      };
    }),

  setGratingFrequency: (slmId, axis, value) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        return {
          ...s,
          gratingFrequency: { ...s.gratingFrequency, [axis]: value },
        };
      }),
    })),

  addMode: (slmId, modeSpec) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        return {
          ...s,
          modes: [
            ...s.modes,
            {
              type: modeSpec.type,
              params: modeSpec.params || {},
              weight: modeSpec.weight ?? 1.0,
              phaseOffset: modeSpec.phaseOffset ?? 0,
              enabled: modeSpec.enabled ?? true,
            },
          ],
        };
      }),
    })),

  removeMode: (slmId, modeIndex) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        const modes = s.modes.filter((_, i) => i !== modeIndex);
        return { ...s, modes };
      }),
    })),

  updateModeParam: (slmId, modeIndex, paramKey, value) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        return {
          ...s,
          modes: s.modes.map((m, i) =>
            i !== modeIndex
              ? m
              : { ...m, params: { ...m.params, [paramKey]: value } }
          ),
        };
      }),
    })),

  updateModeWeight: (slmId, modeIndex, weight) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        return {
          ...s,
          modes: s.modes.map((m, i) =>
            i !== modeIndex ? m : { ...m, weight }
          ),
        };
      }),
    })),

  updateModePhaseOffset: (slmId, modeIndex, phaseOffset) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        return {
          ...s,
          modes: s.modes.map((m, i) =>
            i !== modeIndex ? m : { ...m, phaseOffset }
          ),
        };
      }),
    })),

  toggleModeEnabled: (slmId, modeIndex) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        return {
          ...s,
          modes: s.modes.map((m, i) =>
            i !== modeIndex ? m : { ...m, enabled: !m.enabled }
          ),
        };
      }),
    })),

  reorderModes: (slmId, fromIndex, toIndex) =>
    set((state) => ({
      slms: state.slms.map((s) => {
        if (s.id !== slmId) return s;
        const modes = [...s.modes];
        const [moved] = modes.splice(fromIndex, 1);
        modes.splice(toIndex, 0, moved);
        return { ...s, modes };
      }),
    })),

  setHologramImageData: (slmId, imageData) =>
    set((state) => ({
      slms: state.slms.map((s) =>
        s.id !== slmId ? s : { ...s, hologramImageData: imageData }
      ),
    })),

  setHologramGreyData: (slmId, greyLevels, width, height) =>
    set((state) => ({
      slms: state.slms.map((s) =>
        s.id !== slmId
          ? s
          : { ...s, greyLevels, greyWidth: width, greyHeight: height, isImported: false }
      ),
    })),

  setImportedHologram: (slmId, pixels, width, height) =>
    set((state) => ({
      slms: state.slms.map((s) =>
        s.id !== slmId
          ? s
          : {
              ...s,
              importedPixels: pixels,
              importedWidth: width,
              importedHeight: height,
              isImported: true,
            }
      ),
    })),

  clearImportedHologram: (slmId) =>
    set((state) => ({
      slms: state.slms.map((s) =>
        s.id !== slmId
          ? s
          : {
              ...s,
              importedPixels: null,
              importedWidth: null,
              importedHeight: null,
              isImported: false,
            }
      ),
    })),
}));

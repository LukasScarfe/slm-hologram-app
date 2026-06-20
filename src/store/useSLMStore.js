import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import presets from '../data/slmPresets.json';

const CUSTOM_PRESET = presets.find((p) => p.name === 'Custom');

function defaultGamma(bitDepth) {
  return Math.pow(2, bitDepth) - 1;
}

function clampGamma(gamma, bitDepth) {
  const max = Math.pow(2, bitDepth) - 1;
  return Math.max(1, Math.min(max, Math.round(gamma)));
}

function makeSLM(id, preset, tabLabel) {
  const p = preset || CUSTOM_PRESET;
  const num = id.replace('slm-', '');
  return {
    id,
    name: p.name,
    tabLabel: tabLabel ?? p.name,
    hardware: {
      resX: p.resX,
      resY: p.resY,
      pixelPitchMicron: p.pixelPitchMicron,
      bitDepth: p.bitDepth,
      wavelengthNm: p.wavelengthNm,
      screenId: null,
    },
    gratingFrequency: { fx: 0, fy: 0 },
    holoShift: { x: 0, y: 0 },
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

// Non-serialisable / large binary fields excluded from localStorage.
const TRANSIENT_FIELDS = [
  'hologramImageData',
  'windowRef',
  'greyLevels',
  'greyWidth',
  'greyHeight',
  'importedPixels',
  'importedWidth',
  'importedHeight',
  'isImported',
];

const TRANSIENT_DEFAULTS = {
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

let nextSLMId = 2;

export const useSLMStore = create(
  persist(
    (set, get) => ({
      slms: [makeSLM('slm-1')],
      activeSLMId: 'slm-1',

      setActiveSLM: (id) => set({ activeSLMId: id }),

      renameSLM: (slmId, label) =>
        set((state) => ({
          slms: state.slms.map((s) =>
            s.id !== slmId ? s : { ...s, tabLabel: label }
          ),
        })),

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

      setHoloShift: (slmId, axis, value) =>
        set((state) => ({
          slms: state.slms.map((s) => {
            if (s.id !== slmId) return s;
            return {
              ...s,
              holoShift: { ...s.holoShift, [axis]: value },
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
                {
                  type: modeSpec.type,
                  params: modeSpec.params || {},
                  weight: modeSpec.weight ?? 1.0,
                  phaseOffset: modeSpec.phaseOffset ?? 0,
                  enabled: modeSpec.enabled ?? true,
                  nickname: modeSpec.nickname ?? '',
                },
                ...s.modes,
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

      clearModes: (slmId) =>
        set((state) => ({
          slms: state.slms.map((s) =>
            s.id !== slmId ? s : { ...s, modes: [] }
          ),
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

      setModeNickname: (slmId, modeIndex, nickname) =>
        set((state) => ({
          slms: state.slms.map((s) => {
            if (s.id !== slmId) return s;
            return {
              ...s,
              modes: s.modes.map((m, i) =>
                i !== modeIndex ? m : { ...m, nickname }
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
    }),
    {
      name: 'slm-hologram-studio',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSLMId: state.activeSLMId,
        slms: state.slms.map((slm) => {
          const persisted = { ...slm };
          TRANSIENT_FIELDS.forEach((f) => delete persisted[f]);
          return persisted;
        }),
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        slms: (persistedState.slms ?? []).map((slm) => ({
          holoShift: { x: 0, y: 0 },
          tabLabel: slm.name ?? `SLM ${slm.id?.replace('slm-', '') ?? '?'}`,
          ...TRANSIENT_DEFAULTS,
          ...slm,
          modes: (slm.modes ?? []).map((m) => ({ nickname: '', ...m })),
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.slms?.length) {
          const maxId = Math.max(
            ...state.slms.map((s) => parseInt(s.id.replace('slm-', ''), 10) || 0)
          );
          nextSLMId = maxId + 1;
        }
      },
    }
  )
);

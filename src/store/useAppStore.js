import { create } from 'zustand';

export const useAppStore = create((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));

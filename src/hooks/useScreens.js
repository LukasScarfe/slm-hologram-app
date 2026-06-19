import { useState, useEffect, useCallback } from 'react';

export function useScreens() {
  const [screens, setScreens] = useState([]);

  const buildFallback = useCallback(() => [{
    id: 0,
    label: 'Primary Screen',
    left: window.screen.availLeft ?? 0,
    top: window.screen.availTop ?? 0,
    width: window.screen.availWidth ?? window.screen.width,
    height: window.screen.availHeight ?? window.screen.height,
    isPrimary: true,
  }], []);

  const refresh = useCallback(async () => {
    if ('getScreenDetails' in window) {
      try {
        const details = await window.getScreenDetails();
        const mapped = details.screens.map((s, i) => ({
          id: i,
          label: s.label || `Screen ${i + 1}`,
          left: s.availLeft ?? 0,
          top: s.availTop ?? 0,
          width: s.availWidth ?? s.width,
          height: s.availHeight ?? s.height,
          isPrimary: !!s.isPrimary,
        }));
        setScreens(mapped);
        return;
      } catch {
        // Permission denied or API not supported — fall through
      }
    }
    setScreens(buildFallback());
  }, [buildFallback]);

  useEffect(() => {
    // Populate immediately with fallback; refresh() will upgrade if API is available
    setScreens(buildFallback());
  }, [buildFallback]);

  return { screens, refresh };
}

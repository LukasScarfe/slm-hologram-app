import { useRef, useState, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSLMStore } from '../store/useSLMStore.js';

// Same compute-relevant fields as useHologramCompute — only these trigger a re-send.
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
    };
  };
}

export function useHologramWindow(slmId) {
  const slm = useSLMStore(useShallow(computeParamsSelector(slmId)));

  // Keep a ref so sendToWindow always uses the latest SLM state without recreating
  const slmRef = useRef(slm);
  useEffect(() => { slmRef.current = slm; }, [slm]);

  const windowRef = useRef(null);
  const listenerRef = useRef(null);
  const pollRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const sendToWindow = useCallback((win) => {
    const s = slmRef.current;
    if (!s || !win || win.closed) return;
    try {
      win.postMessage(
        {
          type: 'SLM_PARAMS',
          payload: {
            slmId,
            modes: s.modes,
            hardware: s.hardware,
            encodingMethod: s.encodingMethod,
            gamma: s.gamma,
            gratingFrequency: s.gratingFrequency,
            fullResolution: true,
          },
        },
        '*'
      );
    } catch {
      // Window closed concurrently
    }
  }, [slmId]);

  const tearDown = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (listenerRef.current) {
      window.removeEventListener('message', listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  const closeWindow = useCallback(() => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    windowRef.current = null;
    setIsOpen(false);
    tearDown();
  }, [tearDown]);

  const openWindow = useCallback((targetScreen) => {
    // Close any existing hologram window for this SLM first
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    tearDown();

    const url =
      window.location.origin +
      window.location.pathname +
      '?display=' +
      encodeURIComponent(slmId);

    const sw = targetScreen?.width ?? 1200;
    const sh = targetScreen?.height ?? 800;
    const sl = targetScreen?.left ?? 100;
    const st = targetScreen?.top ?? 100;
    const features = `popup=yes,width=${sw},height=${sh},left=${sl},top=${st}`;

    const popup = window.open(url, `hologram-${slmId}`, features);
    if (!popup) return; // Popup blocked

    windowRef.current = popup;
    setIsOpen(true);


    // Listen for DISPLAY_READY handshake from the child window
    const onMessage = (evt) => {
      if (evt.source !== popup) return;
      if (evt.data?.type === 'DISPLAY_READY' && evt.data.slmId === slmId) {
        sendToWindow(popup);
      }
    };
    listenerRef.current = onMessage;
    window.addEventListener('message', onMessage);

    // Poll to detect when the user closes the popup externally (e.g. X button)
    pollRef.current = setInterval(() => {
      if (popup.closed) {
        windowRef.current = null;
        setIsOpen(false);
        tearDown();
      }
    }, 500);
  }, [slmId, sendToWindow, tearDown]);

  // Re-send params whenever SLM state changes and a hologram window is open
  useEffect(() => {
    if (windowRef.current && !windowRef.current.closed) {
      sendToWindow(windowRef.current);
    }
  }, [slm, sendToWindow]);

  // Close hologram window when the main app window is closed/navigated away
  useEffect(() => {
    function onUnload() { closeWindow(); }
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [closeWindow]);

  // Cleanup message listener and poll interval on unmount
  useEffect(() => {
    return () => { tearDown(); };
  }, [tearDown]);

  const focusWindow = useCallback(() => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.focus();
    }
  }, []);

  return { isOpen, openWindow, closeWindow, focusWindow };
}

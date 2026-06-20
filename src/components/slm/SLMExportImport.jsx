import { useRef, useState } from 'react';
import JSZip from 'jszip';
import { useSLMStore } from '../../store/useSLMStore.js';
import { exportPNG8 } from '../../io/exportPNG8.js';
import { exportPNG16 } from '../../io/exportPNG16.js';
import { exportTIFF } from '../../io/exportTIFF.js';
import { exportBMP } from '../../io/exportBMP.js';
import { exportCSV } from '../../io/exportCSV.js';
import { exportNPY } from '../../io/exportNPY.js';
import { exportBin } from '../../io/exportBin.js';
import { importHologram } from '../../io/importHologram.js';

// Compute a full-resolution hologram for the given SLM state.
// Returns { grey: Uint16Array, width, height }.
function computeFullRes(slm) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../../workers/hologramWorker.js', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'RESULT') {
        worker.terminate();
        resolve({ grey: payload.grey, width: payload.width, height: payload.height });
      } else if (type === 'ERROR') {
        worker.terminate();
        reject(new Error(payload.error));
      }
    };
    worker.onerror = (err) => { worker.terminate(); reject(err); };
    worker.postMessage({
      type: 'COMPUTE',
      payload: {
        slmId: slm.id,
        modes: slm.modes,
        hardware: slm.hardware,
        encodingMethod: slm.encodingMethod,
        gamma: slm.gamma,
        gratingFrequency: slm.gratingFrequency,
        holoShift: slm.holoShift,
        fullResolution: true,
      },
    });
  });
}

const EXPORT_FORMATS = [
  { id: 'png8',  label: 'PNG (8-bit)',           ext: 'png',  mime: 'image/png' },
  { id: 'png16', label: 'PNG (16-bit)',           ext: 'png',  mime: 'image/png' },
  { id: 'tiff',  label: 'TIFF (32-bit)',          ext: 'tif',  mime: 'image/tiff' },
  { id: 'bmp',   label: 'BMP',                    ext: 'bmp',  mime: 'image/bmp' },
  { id: 'csv',   label: 'CSV',                    ext: 'csv',  mime: 'text/csv' },
  { id: 'npy',   label: 'NPY',                    ext: 'npy',  mime: 'application/octet-stream' },
  { id: 'bin',   label: 'Raw Binary',             ext: 'bin',  mime: 'application/octet-stream' },
  { id: 'zip',   label: 'Export All SLMs (ZIP)', ext: 'zip',  mime: 'application/zip' },
];

function triggerDownload(data, filename, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// No longer used for export (we always compute full-res), kept as import helper
function _emptyGrey(slm) {
  const w = slm?.hardware?.resX || 4;
  const h = slm?.hardware?.resY || 4;
  return { grey: new Uint16Array(w * h), width: w, height: h };
}

function greyToRGBA(data, width, height) {
  const N = width * height;
  const rgba = new Uint8ClampedArray(N * 4);
  // Scale to 8-bit based on the natural max of the data type.
  let maxVal;
  if (data instanceof Uint8Array || data instanceof Uint8ClampedArray) {
    maxVal = 255;
  } else if (data instanceof Uint16Array) {
    maxVal = 65535;
  } else {
    // Float32Array: find actual maximum in [0, 1] or raw grey range
    let m = 0;
    for (let i = 0; i < N; i++) if (data[i] > m) m = data[i];
    maxVal = m > 1 ? m : 1;
  }
  for (let i = 0; i < N; i++) {
    const g = Math.round((Number(data[i]) / maxVal) * 255);
    rgba[i * 4] = g;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = g;
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

export function SLMExportImport({ slmId }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [importWarning, setImportWarning] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const slm = useSLMStore((s) => s.slms.find((x) => x.id === slmId));
  const allSlms = useSLMStore((s) => s.slms);
  const setImportedHologram = useSLMStore((s) => s.setImportedHologram);
  const clearImportedHologram = useSLMStore((s) => s.clearImportedHologram);
  const isImported = slm?.isImported ?? false;

  const slmName = slm?.name?.replace(/\s+/g, '_') ?? slmId;

  const handleExport = async (formatId) => {
    setMenuOpen(false);
    setExportBusy(true);
    try {
      await doExport(formatId);
    } finally {
      setExportBusy(false);
    }
  };

  const doExport = async (formatId) => {
    if (formatId === 'zip') {
      const zip = new JSZip();
      for (const s of allSlms) {
        const { grey, width: w, height: h } = await computeFullRes(s);
        const gamma = s.gamma || 255;
        const u8 = new Uint8Array(grey.length);
        for (let i = 0; i < grey.length; i++) {
          u8[i] = Math.round((grey[i] / gamma) * 255);
        }
        const buf = exportPNG8(u8, w, h);
        const name = (s.name?.replace(/\s+/g, '_') ?? s.id) + '.png';
        zip.file(name, buf);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(blob, 'holograms.zip', 'application/zip');
      return;
    }

    const { grey, width: w, height: h } = await computeFullRes(slm);
    const gamma = slm?.gamma || 255;

    let buf, filename, mime;

    switch (formatId) {
      case 'png8': {
        const u8 = new Uint8Array(grey.length);
        for (let i = 0; i < grey.length; i++) u8[i] = Math.round((grey[i] / gamma) * 255);
        buf = exportPNG8(u8, w, h);
        filename = `${slmName}.png`;
        mime = 'image/png';
        break;
      }
      case 'png16': {
        const u16 = new Uint16Array(grey);
        buf = exportPNG16(u16, w, h);
        filename = `${slmName}_16bit.png`;
        mime = 'image/png';
        break;
      }
      case 'tiff': {
        const f32 = new Float32Array(grey.length);
        for (let i = 0; i < grey.length; i++) f32[i] = grey[i] / gamma;
        buf = exportTIFF(f32, w, h);
        filename = `${slmName}.tif`;
        mime = 'image/tiff';
        break;
      }
      case 'bmp': {
        const u8 = new Uint8Array(grey.length);
        for (let i = 0; i < grey.length; i++) u8[i] = Math.round((grey[i] / gamma) * 255);
        buf = exportBMP(u8, w, h);
        filename = `${slmName}.bmp`;
        mime = 'image/bmp';
        break;
      }
      case 'csv': {
        const rows = [];
        for (let y = 0; y < h; y++) {
          const row = [];
          for (let x = 0; x < w; x++) row.push(grey[y * w + x]);
          rows.push(row);
        }
        buf = new TextEncoder().encode(exportCSV(rows));
        filename = `${slmName}.csv`;
        mime = 'text/csv';
        break;
      }
      case 'npy': {
        const f32 = new Float32Array(grey.length);
        for (let i = 0; i < grey.length; i++) f32[i] = grey[i] / gamma;
        buf = exportNPY(f32, w, h);
        filename = `${slmName}.npy`;
        mime = 'application/octet-stream';
        break;
      }
      case 'bin': {
        const f32 = new Float32Array(grey.length);
        for (let i = 0; i < grey.length; i++) f32[i] = grey[i] / gamma;
        buf = exportBin(f32);
        filename = `${slmName}.bin`;
        mime = 'application/octet-stream';
        break;
      }
      default:
        return;
    }

    triggerDownload(buf, filename, mime);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImportWarning(null);
    setImportError(null);

    const buffer = await file.arrayBuffer();
    const result = await importHologram(buffer, file.name, {
      expectedWidth: slm?.hardware?.resX,
      expectedHeight: slm?.hardware?.resY,
    });

    if (result.error) {
      setImportError(result.error);
      return;
    }

    if (result.warning) setImportWarning(result.warning);

    const { data, width, height } = result;
    const rgba = greyToRGBA(data, width, height);
    setImportedHologram(slmId, rgba, width, height);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            data-testid="export-button"
            onClick={() => !exportBusy && setMenuOpen((v) => !v)}
            style={{ ...btnStyle, opacity: exportBusy ? 0.6 : 1 }}
            disabled={exportBusy}
          >
            {exportBusy ? 'Exporting…' : 'Export ▾'}
          </button>
          {menuOpen && (
            <div role="menu" style={menuStyle}>
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.id}
                  role="menuitem"
                  onClick={() => handleExport(f.id)}
                  style={menuItemStyle}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          data-testid="import-button"
          onClick={() => fileInputRef.current?.click()}
          style={btnStyle}
        >
          Import
        </button>
        {isImported && (
          <button
            data-testid="clear-import-button"
            onClick={() => {
              clearImportedHologram(slmId);
              setImportWarning(null);
              setImportError(null);
            }}
            style={{ ...btnStyle, borderColor: '#ff5c5c', color: '#ff5c5c' }}
          >
            Clear Import
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          data-testid="import-file-input"
          accept=".png,.tif,.tiff,.bmp,.csv,.npy,.bin"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {importWarning && (
        <div data-testid="import-warning" style={{ color: '#f59e0b', fontSize: '12px' }}>
          {importWarning}
        </div>
      )}
      {importError && (
        <div data-testid="import-error" style={{ color: '#ff5c5c', fontSize: '12px' }}>
          {importError}
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  padding: '6px 14px',
  background: '#1C2330',
  color: '#E8EDF3',
  border: '1px solid #2a3547',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
};

const menuStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: 100,
  background: '#1C2330',
  border: '1px solid #2a3547',
  borderRadius: '4px',
  minWidth: '200px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
};

const menuItemStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 14px',
  background: 'none',
  color: '#E8EDF3',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
};

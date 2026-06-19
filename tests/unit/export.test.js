import { describe, it, expect } from 'vitest';
import { decode } from 'fast-png';
import Papa from 'papaparse';
import { exportPNG8 } from '../../src/io/exportPNG8.js';
import { exportPNG16 } from '../../src/io/exportPNG16.js';
import { exportCSV } from '../../src/io/exportCSV.js';
import { exportNPY } from '../../src/io/exportNPY.js';
import { exportBin } from '../../src/io/exportBin.js';
import { exportBMP } from '../../src/io/exportBMP.js';
import { importHologram } from '../../src/io/importHologram.js';

// ── 1. exportPNG8 round-trip ──────────────────────────────────────────────────
describe('exportPNG8', () => {
  it('1. 4×4 Uint8Array round-trips through PNG8 exactly', () => {
    const data = new Uint8Array([
       0,  32,  64,  96,
     128, 160, 192, 224,
      10,  20,  30,  40,
      50,  60,  70,  80,
    ]);
    const buf = exportPNG8(data, 4, 4);
    expect(buf).toBeInstanceOf(ArrayBuffer);
    const png = decode(new Uint8Array(buf));
    expect(png.width).toBe(4);
    expect(png.height).toBe(4);
    // fast-png returns 1-channel data for channels=1
    for (let i = 0; i < 16; i++) {
      expect(png.data[i]).toBe(data[i]);
    }
  });
});

// ── 2. exportPNG16 round-trip ─────────────────────────────────────────────────
describe('exportPNG16', () => {
  it('2. 4×4 Uint16Array round-trips through PNG16 within 16-bit rounding', () => {
    const data = new Uint16Array([
       0,  128, 256, 512,
     640,  768, 896, 1023,
     100,  200, 300,  400,
     500,  600, 700,  800,
    ]);
    const buf = exportPNG16(data, 4, 4);
    expect(buf).toBeInstanceOf(ArrayBuffer);
    const png = decode(new Uint8Array(buf));
    expect(png.width).toBe(4);
    expect(png.height).toBe(4);
    for (let i = 0; i < 16; i++) {
      expect(Math.abs(png.data[i] - data[i])).toBeLessThanOrEqual(1);
    }
  });
});

// ── 3 & 4. exportCSV ─────────────────────────────────────────────────────────
describe('exportCSV', () => {
  const matrix = [[0, 128, 255], [64, 192, 32], [100, 200, 50]];

  it('3. 3×3 2D array exports as CSV with 3 rows and 3 values, parseable by Papa', () => {
    const csv = exportCSV(matrix);
    const lines = csv.trim().split('\n').filter((l) => l.trim() !== '');
    expect(lines.length).toBe(3);
    lines.forEach((line) => {
      expect(line.split(',').length).toBe(3);
    });
    const parsed = Papa.parse(csv, { dynamicTyping: true, skipEmptyLines: true });
    expect(parsed.data.length).toBe(3);
  });

  it('4. Re-imported CSV matches original matrix within ±0.5', () => {
    const csv = exportCSV(matrix);
    const parsed = Papa.parse(csv, { dynamicTyping: true, skipEmptyLines: true });
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        expect(Math.abs(parsed.data[y][x] - matrix[y][x])).toBeLessThanOrEqual(0.5);
      }
    }
  });
});

// ── 5 & 6. exportNPY ─────────────────────────────────────────────────────────
describe('exportNPY', () => {
  const data = new Float32Array([1.0, 2.5, 3.7, 4.1, 5.9, 8.3, 0.1, 2.2, 9.9]);

  it('5. NPY buffer starts with \\x93NUMPY, header contains "float32" and shape (3, 3)', () => {
    const buf = exportNPY(data, 3, 3);
    const u8 = new Uint8Array(buf);
    // Magic
    expect(u8[0]).toBe(0x93);
    expect(u8[1]).toBe(0x4e); // N
    expect(u8[2]).toBe(0x55); // U
    expect(u8[3]).toBe(0x4d); // M
    expect(u8[4]).toBe(0x50); // P
    expect(u8[5]).toBe(0x59); // Y
    // Header contains 'float32'
    const dv = new DataView(buf);
    const headerLen = dv.getUint16(8, true);
    const headerStr = new TextDecoder().decode(u8.slice(10, 10 + headerLen));
    expect(headerStr).toContain('float32');
    expect(headerStr).toContain('(3, 3)');
  });

  it('6. NPY float32 data section matches original values within 1e-6', () => {
    const buf = exportNPY(data, 3, 3);
    const dv = new DataView(buf);
    const headerLen = dv.getUint16(8, true);
    const dataStart = 10 + headerLen;
    const f32 = new Float32Array(buf, dataStart, 9);
    for (let i = 0; i < 9; i++) {
      expect(Math.abs(f32[i] - data[i])).toBeLessThan(1e-6);
    }
  });
});

// ── 7. exportBin ─────────────────────────────────────────────────────────────
describe('exportBin', () => {
  it('7. Float32Array round-trips through raw binary with values within 1e-7', () => {
    const data = new Float32Array([3.14159, 2.71828, 1.41421, 0.5, 0.25, 0.125]);
    const buf = exportBin(data);
    expect(buf).toBeInstanceOf(ArrayBuffer);
    expect(buf.byteLength).toBe(data.length * 4);
    const back = new Float32Array(buf);
    for (let i = 0; i < data.length; i++) {
      expect(Math.abs(back[i] - data[i])).toBeLessThan(1e-7);
    }
  });
});

// ── 8. exportBMP ─────────────────────────────────────────────────────────────
describe('exportBMP', () => {
  it('8. BMP starts with BM magic, header width/height match input dimensions', () => {
    const data = new Uint8Array(6 * 4);
    data.fill(128);
    const buf = exportBMP(data, 6, 4);
    const u8 = new Uint8Array(buf);
    expect(u8[0]).toBe(0x42); // 'B'
    expect(u8[1]).toBe(0x4d); // 'M'
    const dv = new DataView(buf);
    const w = dv.getInt32(18, true);
    const h = Math.abs(dv.getInt32(22, true));
    expect(w).toBe(6);
    expect(h).toBe(4);
  });
});

// ── 9–12. importHologram ─────────────────────────────────────────────────────
describe('importHologram', () => {
  it('9. importHologram with PNG8 returns {data: Uint8Array, width, height, bitDepth: 8}', async () => {
    const orig = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]);
    const buf = exportPNG8(orig, 4, 4);
    const result = await importHologram(buf, 'test.png');
    expect(result.error).toBeUndefined();
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expect(result.bitDepth).toBe(8);
    expect(result.data).toBeInstanceOf(Uint8Array);
  });

  it('10. importHologram with CSV returns {data: Float32Array, width, height}', async () => {
    const csv = exportCSV([[0, 128, 255], [64, 192, 32], [100, 200, 50]]);
    const buf = new TextEncoder().encode(csv).buffer;
    const result = await importHologram(buf, 'test.csv');
    expect(result.error).toBeUndefined();
    expect(result.width).toBe(3);
    expect(result.height).toBe(3);
    expect(result.data).toBeInstanceOf(Float32Array);
  });

  it('11. importHologram with mismatched resolution returns warning', async () => {
    // Create a 4×4 PNG then try to import into a 8×8 SLM
    const orig = new Uint8Array(16).fill(100);
    const buf = exportPNG8(orig, 4, 4);
    const result = await importHologram(buf, 'test.png', {
      expectedWidth: 8,
      expectedHeight: 8,
    });
    expect(result.error).toBeUndefined();
    expect(typeof result.warning).toBe('string');
    expect(result.warning.length).toBeGreaterThan(0);
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
  });

  it('12. importHologram with unsupported type returns {error: string}', async () => {
    const buf = new TextEncoder().encode('hello').buffer;
    const result = await importHologram(buf, 'data.txt');
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });
});

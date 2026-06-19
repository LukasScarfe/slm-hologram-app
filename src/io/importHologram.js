import { decode } from 'fast-png';
import Papa from 'papaparse';

// buffer: ArrayBuffer
// filename: string (extension used for type detection)
// options: { expectedWidth?: number, expectedHeight?: number }
// Returns: { data, width, height, bitDepth?, warning?, error? }
export async function importHologram(buffer, filename, options = {}) {
  const ext = filename.split('.').pop().toLowerCase();
  const { expectedWidth, expectedHeight } = options;

  if (ext === 'png') {
    return importPNG(buffer, expectedWidth, expectedHeight);
  }
  if (ext === 'csv') {
    return importCSV(buffer, expectedWidth, expectedHeight);
  }
  if (ext === 'npy') {
    return importNPY(buffer, expectedWidth, expectedHeight);
  }
  if (ext === 'bin') {
    return importBin(buffer, expectedWidth, expectedHeight);
  }
  if (ext === 'bmp') {
    return importBMP(buffer, expectedWidth, expectedHeight);
  }
  if (ext === 'tif' || ext === 'tiff') {
    return importTIFF(buffer, expectedWidth, expectedHeight);
  }
  return { error: `Unsupported file type: .${ext}` };
}

function checkDimensions(width, height, expectedWidth, expectedHeight) {
  if (
    expectedWidth != null &&
    expectedHeight != null &&
    (width !== expectedWidth || height !== expectedHeight)
  ) {
    return `Imported image is ${width}×${height} but SLM is configured for ${expectedWidth}×${expectedHeight}.`;
  }
  return null;
}

function importPNG(buffer, expectedWidth, expectedHeight) {
  try {
    const png = decode(new Uint8Array(buffer));
    const { width, height, data, depth } = png;
    const warning = checkDimensions(width, height, expectedWidth, expectedHeight);
    const bitDepth = depth === 16 ? 16 : 8;
    // data is already Uint8Array (8-bit) or Uint16Array (16-bit) for channels=1
    const result = { data, width, height, bitDepth };
    if (warning) result.warning = warning;
    return result;
  } catch (err) {
    return { error: `Failed to decode PNG: ${err.message}` };
  }
}

function importCSV(buffer, expectedWidth, expectedHeight) {
  try {
    const text = new TextDecoder().decode(buffer);
    const result = Papa.parse(text, { dynamicTyping: true, skipEmptyLines: true });
    const rows = result.data.filter((r) => Array.isArray(r) && r.length > 0);
    if (rows.length === 0) return { error: 'CSV is empty' };
    const height = rows.length;
    const width = rows[0].length;
    const data = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        data[y * width + x] = Number(rows[y][x]) || 0;
      }
    }
    const warning = checkDimensions(width, height, expectedWidth, expectedHeight);
    const out = { data, width, height };
    if (warning) out.warning = warning;
    return out;
  } catch (err) {
    return { error: `Failed to parse CSV: ${err.message}` };
  }
}

function importNPY(buffer, expectedWidth, expectedHeight) {
  try {
    const u8 = new Uint8Array(buffer);
    // Verify magic
    if (u8[0] !== 0x93 || u8[1] !== 0x4e) return { error: 'Not a valid NPY file' };
    const dv = new DataView(buffer);
    const headerLen = dv.getUint16(8, true);
    const headerStr = new TextDecoder().decode(u8.slice(10, 10 + headerLen));
    // Extract shape from header dict
    const shapeMatch = headerStr.match(/['"]shape['"]\s*:\s*\((\d+),\s*(\d+)\)/);
    if (!shapeMatch) return { error: 'Cannot parse NPY shape' };
    const height = parseInt(shapeMatch[1], 10);
    const width = parseInt(shapeMatch[2], 10);
    const dataStart = 10 + headerLen;
    const data = new Float32Array(buffer, dataStart, width * height);
    const warning = checkDimensions(width, height, expectedWidth, expectedHeight);
    const out = { data: new Float32Array(data), width, height };
    if (warning) out.warning = warning;
    return out;
  } catch (err) {
    return { error: `Failed to parse NPY: ${err.message}` };
  }
}

function importBin(buffer, expectedWidth, expectedHeight) {
  const data = new Float32Array(buffer);
  // Without embedded dimensions we can't determine width/height; return flat with warning
  const total = data.length;
  const width = expectedWidth || total;
  const height = expectedHeight || 1;
  return { data, width, height };
}

function importBMP(buffer, expectedWidth, expectedHeight) {
  try {
    const dv = new DataView(buffer);
    if (dv.getUint8(0) !== 0x42 || dv.getUint8(1) !== 0x4d) return { error: 'Not a BMP file' };
    const dataOffset = dv.getUint32(10, true);
    const width = dv.getInt32(18, true);
    const absHeight = Math.abs(dv.getInt32(22, true));
    const rowStride = Math.ceil(width / 4) * 4;
    const data = new Uint8Array(width * absHeight);
    // BMP rows are bottom-to-top
    for (let y = 0; y < absHeight; y++) {
      const srcRow = absHeight - 1 - y;
      const srcOff = dataOffset + srcRow * rowStride;
      for (let x = 0; x < width; x++) {
        data[y * width + x] = new Uint8Array(buffer)[srcOff + x];
      }
    }
    const warning = checkDimensions(width, absHeight, expectedWidth, expectedHeight);
    const out = { data, width, height: absHeight, bitDepth: 8 };
    if (warning) out.warning = warning;
    return out;
  } catch (err) {
    return { error: `Failed to parse BMP: ${err.message}` };
  }
}

function importTIFF(buffer, expectedWidth, expectedHeight) {
  // Minimal TIFF reader (little-endian, uncompressed, float32 or uint8)
  try {
    const dv = new DataView(buffer);
    const byteOrder = dv.getUint16(0, true);
    const le = byteOrder === 0x4949;
    const magic = dv.getUint16(2, le);
    if (magic !== 42) return { error: 'Not a valid TIFF file' };
    const ifdOffset = dv.getUint32(4, le);
    const numEntries = dv.getUint16(ifdOffset, le);
    const tags = {};
    for (let i = 0; i < numEntries; i++) {
      const off = ifdOffset + 2 + i * 12;
      const tag = dv.getUint16(off, le);
      const type = dv.getUint16(off + 2, le);
      const count = dv.getUint32(off + 4, le);
      const valOff = off + 8;
      let val;
      if (type === 3) val = dv.getUint16(valOff, le);
      else if (type === 4) val = dv.getUint32(valOff, le);
      else val = dv.getUint32(valOff, le);
      tags[tag] = { type, count, val };
    }
    const width = tags[256]?.val;
    const height = tags[257]?.val;
    const bitsPerSample = tags[258]?.val || 8;
    const stripOffset = tags[273]?.val;
    const sampleFormat = tags[339]?.val || 1;
    if (!width || !height || stripOffset == null) return { error: 'Invalid TIFF structure' };
    let data;
    if (sampleFormat === 3 && bitsPerSample === 32) {
      data = new Float32Array(width * height);
      for (let i = 0; i < width * height; i++) {
        data[i] = dv.getFloat32(stripOffset + i * 4, le);
      }
    } else {
      data = new Uint8Array(buffer, stripOffset, width * height);
    }
    const warning = checkDimensions(width, height, expectedWidth, expectedHeight);
    const out = { data, width, height, bitDepth: bitsPerSample };
    if (warning) out.warning = warning;
    return out;
  } catch (err) {
    return { error: `Failed to parse TIFF: ${err.message}` };
  }
}

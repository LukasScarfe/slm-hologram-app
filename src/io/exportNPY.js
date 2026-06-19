// Minimal NPY v1.0 writer for float32 2D arrays.
// Spec: https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html

// data: Float32Array of length width*height
// Returns ArrayBuffer
export function exportNPY(data, width, height) {
  const headerDict = `{'descr': 'float32', 'fortran_order': False, 'shape': (${height}, ${width}), }`;
  // Total prefix = 10 bytes; (10 + headerStr.length) must be multiple of 64
  const rawLen = headerDict.length + 1; // +1 for final '\n'
  const rem = (10 + rawLen) % 64;
  const padSpaces = rem === 0 ? 0 : 64 - rem;
  const headerStr = headerDict + ' '.repeat(padSpaces) + '\n';

  const prefixLen = 10;
  const totalBytes = prefixLen + headerStr.length + data.length * 4;
  const buf = new ArrayBuffer(totalBytes);
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);

  // Magic: \x93NUMPY
  u8[0] = 0x93;
  u8[1] = 0x4e; // N
  u8[2] = 0x55; // U
  u8[3] = 0x4d; // M
  u8[4] = 0x50; // P
  u8[5] = 0x59; // Y
  u8[6] = 1;    // major version
  u8[7] = 0;    // minor version
  // HEADER_LEN (uint16 LE)
  dv.setUint16(8, headerStr.length, true);

  // Header string (ASCII)
  for (let i = 0; i < headerStr.length; i++) {
    u8[10 + i] = headerStr.charCodeAt(i);
  }

  // Data: float32 little-endian
  const dataOff = 10 + headerStr.length;
  for (let i = 0; i < data.length; i++) {
    dv.setFloat32(dataOff + i * 4, data[i], true);
  }

  return buf;
}

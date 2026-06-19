// data: Float32Array
// Returns ArrayBuffer (raw float32 little-endian)
export function exportBin(data) {
  const buf = new ArrayBuffer(data.length * 4);
  const out = new Float32Array(buf);
  out.set(data);
  return buf;
}

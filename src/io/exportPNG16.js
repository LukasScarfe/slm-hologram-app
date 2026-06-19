import { encode } from 'fast-png';

// greyData: Uint16Array of length width*height
// Returns ArrayBuffer containing a 16-bit greyscale PNG
export function exportPNG16(greyData, width, height) {
  const result = encode({ width, height, data: greyData, depth: 16, channels: 1 });
  return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
}

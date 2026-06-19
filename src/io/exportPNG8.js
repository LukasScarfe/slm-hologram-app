import { encode } from 'fast-png';

// greyData: Uint8Array of length width*height, values 0-255
// Returns ArrayBuffer containing the PNG file
export function exportPNG8(greyData, width, height) {
  const result = encode({ width, height, data: greyData, depth: 8, channels: 1 });
  return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
}

// Minimal 8-bit greyscale BMP writer.
// greyData: Uint8Array of length width*height (values 0-255)
// Returns ArrayBuffer
export function exportBMP(greyData, width, height) {
  // BMP rows are padded to 4-byte boundaries and stored bottom-to-top
  const rowStride = Math.ceil(width / 4) * 4;
  const pixelDataSize = rowStride * height;
  const colorTableSize = 256 * 4; // 256 greyscale palette entries
  const dibHeaderSize = 40;       // BITMAPINFOHEADER
  const fileHeaderSize = 14;
  const dataOffset = fileHeaderSize + dibHeaderSize + colorTableSize;
  const fileSize = dataOffset + pixelDataSize;

  const buf = new ArrayBuffer(fileSize);
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);

  // File header
  u8[0] = 0x42; // 'B'
  u8[1] = 0x4d; // 'M'
  dv.setUint32(2, fileSize, true);
  dv.setUint16(6, 0, true);  // reserved1
  dv.setUint16(8, 0, true);  // reserved2
  dv.setUint32(10, dataOffset, true);

  // BITMAPINFOHEADER
  dv.setUint32(14, dibHeaderSize, true);
  dv.setInt32(18, width, true);
  dv.setInt32(22, height, true);     // positive = bottom-to-top
  dv.setUint16(26, 1, true);         // planes
  dv.setUint16(28, 8, true);         // bitsPerPixel
  dv.setUint32(30, 0, true);         // compression = BI_RGB
  dv.setUint32(34, pixelDataSize, true);
  dv.setInt32(38, 2835, true);       // xPelsPerMeter (~72 dpi)
  dv.setInt32(42, 2835, true);       // yPelsPerMeter
  dv.setUint32(46, 256, true);       // clrUsed
  dv.setUint32(50, 256, true);       // clrImportant

  // Greyscale colour table
  const ctOff = fileHeaderSize + dibHeaderSize;
  for (let i = 0; i < 256; i++) {
    u8[ctOff + i * 4 + 0] = i; // B
    u8[ctOff + i * 4 + 1] = i; // G
    u8[ctOff + i * 4 + 2] = i; // R
    u8[ctOff + i * 4 + 3] = 0; // reserved
  }

  // Pixel data — bottom-to-top rows
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y);
    const dstOff = dataOffset + y * rowStride;
    for (let x = 0; x < width; x++) {
      u8[dstOff + x] = greyData[srcRow * width + x];
    }
    // Padding bytes (already zero from ArrayBuffer)
  }

  return buf;
}

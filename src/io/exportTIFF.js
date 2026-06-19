// Minimal 32-bit float greyscale TIFF (little-endian, single strip, no compression).
// data: Float32Array of length width*height
// Returns ArrayBuffer
export function exportTIFF(data, width, height) {
  // IFD tags (sorted ascending)
  // We store 11 tags; image data follows immediately after the IFD.
  const numTags = 11;
  const ifdOff = 8;
  const ifdSize = 2 + numTags * 12 + 4; // count + entries + next_ifd
  const imageDataOff = ifdOff + ifdSize;
  const imageDataSize = width * height * 4;
  const fileSize = imageDataOff + imageDataSize;

  const buf = new ArrayBuffer(fileSize);
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);

  // TIFF header (little-endian)
  u8[0] = 0x49; u8[1] = 0x49; // "II"
  dv.setUint16(2, 42, true);   // magic
  dv.setUint32(4, ifdOff, true); // offset to first IFD

  // IFD entry count
  dv.setUint16(ifdOff, numTags, true);

  let ep = ifdOff + 2; // entry pointer
  function writeEntry(tag, type, count, value) {
    dv.setUint16(ep, tag, true);
    dv.setUint16(ep + 2, type, true);
    dv.setUint32(ep + 4, count, true);
    dv.setUint32(ep + 8, value, true);
    ep += 12;
  }

  // Types: 3=SHORT (2-byte), 4=LONG (4-byte)
  writeEntry(256, 4, 1, width);           // ImageWidth
  writeEntry(257, 4, 1, height);          // ImageLength
  writeEntry(258, 3, 1, 32);             // BitsPerSample = 32
  writeEntry(259, 3, 1, 1);             // Compression = none
  writeEntry(262, 3, 1, 1);             // PhotometricInterpretation = BlackIsZero
  writeEntry(273, 4, 1, imageDataOff);  // StripOffsets
  writeEntry(277, 3, 1, 1);             // SamplesPerPixel = 1
  writeEntry(278, 4, 1, height);        // RowsPerStrip
  writeEntry(279, 4, 1, imageDataSize); // StripByteCounts
  writeEntry(284, 3, 1, 1);             // PlanarConfiguration = chunky
  writeEntry(339, 3, 1, 3);             // SampleFormat = IEEE float

  // Next IFD offset = 0 (no more IFDs)
  dv.setUint32(ep, 0, true);

  // Image data (float32 LE)
  for (let i = 0; i < data.length; i++) {
    dv.setFloat32(imageDataOff + i * 4, data[i], true);
  }

  return buf;
}

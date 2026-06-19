import Papa from 'papaparse';

// greyData: 2D array [[row0col0, row0col1, ...], ...] OR flat array + width/height
// Returns CSV string
export function exportCSV(greyData, width, height) {
  let rows;
  if (Array.isArray(greyData) && Array.isArray(greyData[0])) {
    rows = greyData;
  } else {
    rows = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        row.push(greyData[y * width + x]);
      }
      rows.push(row);
    }
  }
  return Papa.unparse(rows, { header: false });
}

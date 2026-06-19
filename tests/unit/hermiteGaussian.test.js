import { describe, it, expect } from 'vitest';
import { hermiteGaussian } from '../../src/physics/modes/hermiteGaussian.js';

// Counts sign changes, treating exact zeros as neither positive nor negative
// (skips over zero-valued samples to find the last non-zero sign).
function countZeroCrossings(values) {
  let count = 0;
  let lastSign = null;
  for (const v of values) {
    const s = v > 0 ? 1 : v < 0 ? -1 : 0;
    if (s !== 0) {
      if (lastSign !== null && lastSign !== s) count++;
      lastSign = s;
    }
  }
  return count;
}

describe('hermiteGaussian', () => {
  it('HG(m=1,n=0): exactly one zero crossing along x-axis through centre', () => {
    const resX = 256, resY = 256;
    const field = hermiteGaussian({ resX, resY, w0: 50, m: 1, n: 0 });
    const cy = Math.floor(resY / 2);
    const xVals = [];
    for (let xi = 1; xi < resX - 1; xi++) {
      xVals.push(field[2 * (cy * resX + xi)]);
    }
    expect(countZeroCrossings(xVals)).toBe(1);
  });

  it('HG(m=0,n=1): exactly one zero crossing along y-axis through centre', () => {
    const resX = 256, resY = 256;
    const field = hermiteGaussian({ resX, resY, w0: 50, m: 0, n: 1 });
    const cx = Math.floor(resX / 2);
    const yVals = [];
    for (let yi = 1; yi < resY - 1; yi++) {
      yVals.push(field[2 * (yi * resX + cx)]);
    }
    expect(countZeroCrossings(yVals)).toBe(1);
  });

  it('HG(m=2,n=0): exactly two zero crossings along x-axis', () => {
    const resX = 256, resY = 256;
    const field = hermiteGaussian({ resX, resY, w0: 50, m: 2, n: 0 });
    const cy = Math.floor(resY / 2);
    const xVals = [];
    for (let xi = 1; xi < resX - 1; xi++) {
      xVals.push(field[2 * (cy * resX + xi)]);
    }
    expect(countZeroCrossings(xVals)).toBe(2);
  });
});

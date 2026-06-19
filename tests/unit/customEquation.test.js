import { describe, it, expect } from 'vitest';
import { customEquation } from '../../src/physics/modes/customEquation.js';

describe('customEquation', () => {
  it('returns Float32Array of length 2 * resX * resY for a valid equation', () => {
    const field = customEquation({ resX: 64, resY: 64, equation: 'sin(x)' });
    expect(field).toBeInstanceOf(Float32Array);
    expect(field.length).toBe(2 * 64 * 64);
  });

  it('sin(2 * pi * x / 50) produces ~50 px period in the central row', () => {
    const N = 256;
    const field = customEquation({ resX: N, resY: N, equation: 'sin(2 * pi * x / 50)' });
    expect(field).toBeInstanceOf(Float32Array);

    const j = Math.floor(N / 2);
    // Collect centre-row real parts (y=0 → sin(2π*x/50))
    const row = Array.from({ length: N }, (_, i) => field[2 * (j * N + i)]);

    // Positive-to-negative zero crossings occur every ~50 px
    const crossings = [];
    for (let i = 1; i < N; i++) {
      if (row[i - 1] > 0 && row[i] <= 0) crossings.push(i);
    }
    expect(crossings.length).toBeGreaterThanOrEqual(2);
    const spacing = crossings[1] - crossings[0];
    expect(Math.abs(spacing - 50)).toBeLessThan(5);
  });

  it('returns { error: string } for an invalid equation', () => {
    const result = customEquation({ resX: 32, resY: 32, equation: '@@invalid@@' });
    expect(result).not.toBeInstanceOf(Float32Array);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });
});

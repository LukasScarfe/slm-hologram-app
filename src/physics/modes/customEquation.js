// User-defined field: evaluated via math.js compile().
// Variables available in scope: x, y, r, phi, pi, e
// Returns Float32Array on success, or { error: string } on parse/runtime failure.

import { compile } from 'mathjs';

export function customEquation({ resX, resY, equation = '', x0 = 0, y0 = 0 }) {
  let expr;
  try {
    expr = compile(equation);
  } catch (err) {
    return { error: String(err.message ?? err) };
  }

  const out = new Float32Array(2 * resX * resY);
  const cx = resX / 2 + x0;
  const cy = resY / 2 + y0;

  try {
    for (let j = 0; j < resY; j++) {
      for (let i = 0; i < resX; i++) {
        const dx = i - cx;
        const dy = j - cy;
        const r = Math.sqrt(dx * dx + dy * dy);
        const phi = Math.atan2(dy, dx);
        const scope = { x: dx, y: dy, r, phi, pi: Math.PI, e: Math.E };
        const val = expr.evaluate(scope);
        const idx = 2 * (j * resX + i);
        if (typeof val === 'number') {
          out[idx] = val;
          out[idx + 1] = 0;
        } else if (val !== null && typeof val === 'object' && typeof val.re === 'number') {
          out[idx] = val.re;
          out[idx + 1] = typeof val.im === 'number' ? val.im : 0;
        }
      }
    }
  } catch (err) {
    return { error: String(err.message ?? err) };
  }

  return out;
}

import { test, expect } from 'vitest';
import { generatePuzzle } from './generate';
import { solverById } from './solvers';
import { SIZES } from './sizes';

// Random 8 x 8 and 9 x 9 boards can keep even the pruned search busy for seconds, so only the
// smaller ones go through the solver.
const SOLVE_UP_TO = 7;

for (const size of SIZES) {
  test(`generated ${size} x ${size} puzzles are well formed`, () => {
    for (let i = 0; i < 20; i++) {
      const pairs = generatePuzzle(size);
      const dots = pairs.flat();
      expect(pairs.every((p) => p.length === 0 || p.length === 2)).toBe(true);
      expect(new Set(dots).size).toBe(dots.length);
      expect(dots.every((id) => id >= 0 && id < size * size)).toBe(true);
      if (size <= SOLVE_UP_TO) expect(solverById('pruned').solve(size, pairs).solved).toBe(true);
    }
  });
}

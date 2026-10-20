import { test, expect } from 'vitest';
import { PUZZLES, parsePuzzle } from '/Users/rahulbaradol/Documents/projects/free-flow/src/puzzles.js';
import { SOLVERS } from '/Users/rahulbaradol/Documents/projects/free-flow/src/solvers/index.js';
for (const [size, text] of Object.entries(PUZZLES)) {
  test(`${size}`, () => {
    const pairs = parsePuzzle(text);
    const used = pairs.map((p, c) => p.length && c).filter(Boolean);
    expect(pairs.every((p) => p.length === 0 || p.length === 2)).toBe(true);
    for (const s of SOLVERS) {
      const t = performance.now();
      const r = s.solve(Number(size), pairs);
      console.log(size, s.id, 'colors', used.length, 'solved', r.solved, Math.round(performance.now() - t) + 'ms', 'steps', r.trace.length);
      expect(r.solved).toBe(true);
    }
  });
}

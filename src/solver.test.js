import { describe, test, expect } from 'vitest';
import { solve } from './solver';

// Checks that every color is one unbroken path between its dots and the board is full.
function expectValidSolution(size, pairs, result) {
  expect(result.solved).toBe(true);

  const owner = Array(size * size).fill(0);
  pairs.forEach((ids, code) => ids?.forEach((id) => (owner[id] = code)));
  result.order.forEach(({ id, color }) => {
    expect(owner[id]).toBe(0);
    owner[id] = color;
  });
  expect(owner.every(Boolean)).toBe(true);

  const adjacent = (a, b) =>
    Math.abs(Math.floor(a / size) - Math.floor(b / size)) + Math.abs((a % size) - (b % size)) === 1;

  result.ends.forEach(([start, end], code) => {
    const path = [start, ...result.order.filter((c) => c.color === code).map((c) => c.id), end];
    for (let i = 1; i < path.length; i++) {
      expect(adjacent(path[i - 1], path[i])).toBe(true);
    }
  });
}

describe('solve', () => {
  test('solves a 5 x 5 level', () => {
    const pairs = [];
    pairs[1] = [0, 12];
    pairs[2] = [8, 24];
    pairs[3] = [6, 21];
    pairs[4] = [3, 19];
    pairs[5] = [11, 22];
    expectValidSolution(5, pairs, solve(5, pairs));
  });

  test('solves a 6 x 6 level', () => {
    // Rows: AAABBB / CCCDDB / CEEEDB / CFFEDG / HHFEDG / HHFFGG with dots at path ends.
    const pairs = [];
    pairs[1] = [0, 2];
    pairs[2] = [3, 17];
    pairs[3] = [8, 18];
    pairs[4] = [9, 28];
    pairs[5] = [13, 27];
    pairs[6] = [19, 33];
    pairs[7] = [23, 34];
    pairs[8] = [24, 30];
    expectValidSolution(6, pairs, solve(6, pairs));
  });

  test('reports when no solution fills the board', () => {
    const pairs = [];
    // Both dots on the same checkerboard color, so a path through all 16 cells is impossible.
    pairs[1] = [0, 5];
    expect(solve(4, pairs).solved).toBe(false);
  });

  test('reports unsolved when there are no dots', () => {
    expect(solve(4, []).solved).toBe(false);
  });
});

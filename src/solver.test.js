import { describe, test, expect } from 'vitest';
import { EXTEND, PRUNE, RETRACT, decodeStep, solve } from './solver';
import { createSearchReplay } from './search';

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

describe('trace', () => {
  test('replays the search, backtracking included, ending on the solution', () => {
    const pairs = [];
    pairs[1] = [0, 12];
    pairs[2] = [8, 24];
    pairs[3] = [6, 21];
    pairs[4] = [3, 19];
    pairs[5] = [11, 22];
    const result = solve(5, pairs);
    const steps = Array.from(result.trace, decodeStep);
    expect(steps.some((step) => step.type === RETRACT)).toBe(true);

    // Every backtrack undoes the newest cell of that color's path.
    const stacks = result.ends.map(() => []);
    for (const { type, color, id } of steps) {
      if (type === EXTEND) stacks[color].push(id);
      if (type === RETRACT || type === PRUNE) expect(stacks[color].pop()).toBe(id);
    }

    const end = createSearchReplay(result).at(result.trace.length);
    result.ends.forEach((_, code) => {
      expect(end.connected[code]).toBe(true);
      expect(end.stacks[code]).toEqual(result.order.filter((c) => c.color === code).map((c) => c.id));
    });
  });

  test('rebuilds any step from snapshots the same as a full replay', () => {
    const pairs = [];
    pairs[1] = [0, 2];
    pairs[2] = [3, 17];
    pairs[3] = [8, 18];
    pairs[4] = [9, 28];
    pairs[5] = [13, 27];
    pairs[6] = [19, 33];
    pairs[7] = [23, 34];
    pairs[8] = [24, 30];
    const result = solve(6, pairs);
    expect(result.trace.length).toBeGreaterThan(512);

    const replay = createSearchReplay(result);
    const stacks = result.ends.map(() => []);
    result.trace.forEach((code, i) => {
      const { type, color, id } = decodeStep(code);
      if (type === EXTEND) stacks[color].push(id);
      if (type === RETRACT || type === PRUNE) stacks[color].pop();
      expect(replay.at(i + 1).stacks).toEqual(stacks);
    });
  });
});

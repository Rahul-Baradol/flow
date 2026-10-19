import { describe, test, expect } from 'vitest';
import { SOLVERS } from '.';
import { EXTEND, PRUNE, RETRACT, decodeStep } from './trace';
import { createSearchReplay } from '../search';

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

// Replays the trace step by step: every backtrack must undo the newest cell of that color's
// path, and the replay must end on the reported solution.
function expectTraceEndsOnSolution(result) {
  const stacks = result.ends.map(() => []);
  for (const code of result.trace) {
    const { type, color, id } = decodeStep(code);
    if (type === EXTEND) stacks[color].push(id);
    if (type === RETRACT || type === PRUNE) expect(stacks[color].pop()).toBe(id);
  }

  const end = createSearchReplay(result).at(result.trace.length);
  result.ends.forEach((_, code) => {
    const route = result.order.filter((c) => c.color === code).map((c) => c.id);
    expect(stacks[code]).toEqual(route);
    expect(end.stacks[code]).toEqual(route);
    expect(end.connected[code]).toBe(true);
  });
}

const level = (entries) => {
  const pairs = [];
  entries.forEach(([code, ids]) => (pairs[code] = ids));
  return pairs;
};

const FIVE = level([[1, [0, 12]], [2, [8, 24]], [3, [6, 21]], [4, [3, 19]], [5, [11, 22]]]);
// Rows: AAABBB / CCCDDB / CEEEDB / CFFEDG / HHFEDG / HHFFGG with dots at path ends.
const SIX = level([
  [1, [0, 2]], [2, [3, 17]], [3, [8, 18]], [4, [9, 28]],
  [5, [13, 27]], [6, [19, 33]], [7, [23, 34]], [8, [24, 30]],
]);

describe.each(SOLVERS)('$name', ({ solve }) => {
  test('solves a 5 x 5 level, and its trace replays to the solution', () => {
    const result = solve(5, FIVE);
    expectValidSolution(5, FIVE, result);
    expectTraceEndsOnSolution(result);
  });

  test('solves a 6 x 6 level, and its trace replays to the solution', () => {
    const result = solve(6, SIX);
    expectValidSolution(6, SIX, result);
    expectTraceEndsOnSolution(result);
  });

  test('keeps searching when the last color connects but leaves cells empty', () => {
    // Red's shortest route is straight down column 1, which would leave column 2 empty.
    const pairs = level([[1, [0, 12]], [2, [1, 13]]]);
    const result = solve(4, pairs);
    expectValidSolution(4, pairs, result);
    expectTraceEndsOnSolution(result);
  });

  test('reports when no solution fills the board', () => {
    // Both dots on the same checkerboard color, so a path through all 16 cells is impossible.
    expect(solve(4, level([[1, [0, 5]]])).solved).toBe(false);
  });

  test('reports unsolved when there are no dots', () => {
    expect(solve(4, []).solved).toBe(false);
  });
});

describe('Pruned DFS', () => {
  const { solve } = SOLVERS[0];

  test('solves a 9 x 9 level', () => {
    // Columns as vertical strips: color c runs down column 2c - 2 and back up column 2c - 1.
    const pairs = level([[1, [0, 1]], [2, [2, 3]], [3, [4, 5]], [4, [6, 7]], [5, [8, 80]]]);
    const result = solve(9, pairs);
    expectValidSolution(9, pairs, result);
    expectTraceEndsOnSolution(result);
  });

  test('rebuilds any step from snapshots the same as a full replay', () => {
    const result = solve(6, SIX);
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

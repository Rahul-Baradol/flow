import { CONNECT, DISCONNECT, EXTEND, noDots, RETRACT, createTrace, neighbors } from './trace';

// Port of "solver - iterative dfs using stack.cpp": the same brute force as solveRecursive, but
// the search runs on an explicit stack. Colors go in order of their first dot in reading order,
// from that dot to the other. Each cell counts its "deflections" (branches still waiting on the
// stack); at a dead end the path unwinds back to the nearest cell that has one left.
//
// Unlike the C++ original, connecting the last color only counts as solved when the board is
// full; otherwise that branch is treated as a dead end and the search goes on.
//
// Takes and returns the same shapes as solvePruned.
export function solveIterative(size, pairs) {
  const ends = [];
  pairs.forEach((ids, code) => {
    if (ids?.length === 2) ends[code] = [Math.min(...ids), Math.max(...ids)];
  });
  const colors = Object.keys(ends)
    .map(Number)
    .sort((a, b) => ends[a][0] - ends[b][0]);
  if (colors.length === 0) return noDots();

  const adjacent = neighbors(size);
  const vis = new Uint8Array(size * size); // 0 free, 1 on a path, 2 an untouched dot
  const grid = new Uint8Array(size * size); // color in each cell, 0 when empty
  const isDot = new Uint8Array(size * size);
  colors.forEach((code) =>
    ends[code].forEach((id) => ((vis[id] = 2), (grid[id] = code), (isDot[id] = 1)))
  );
  const deflections = new Int32Array(size * size);
  const position = []; // position[code] = index of that color in `colors`
  colors.forEach((code, i) => (position[code] = i));

  const trace = createTrace();
  const path = []; // every cell on the current paths, starting dots included
  const stack = [[ends[colors[0]][0], colors[0]]];
  let solved = false;

  // Back the paths out to the nearest cell with a branch still on the stack.
  function unwind() {
    while (path.length) {
      const id = path[path.length - 1];
      if (deflections[id] > 0) {
        deflections[id]--;
        return;
      }
      path.pop();
      const code = grid[id];
      if (isDot[id]) {
        // Leaving a color's starting dot undoes the connection that led into it.
        vis[id] = 2;
        if (position[code] > 0) trace.record(DISCONNECT, colors[position[code] - 1]);
      } else {
        vis[id] = 0;
        grid[id] = 0;
        trace.record(RETRACT, code, id);
      }
    }
  }

  while (stack.length) {
    const [id, code] = stack.pop();

    if (id === ends[code][1]) {
      trace.record(CONNECT, code);
      const next = colors[position[code] + 1];
      if (next !== undefined) {
        stack.push([ends[next][0], next]);
        continue;
      }
      if (vis.every((v) => v !== 0)) {
        solved = true;
        break;
      }
      trace.record(DISCONNECT, code);
      unwind();
      continue;
    }

    path.push(id);
    vis[id] = 1;
    grid[id] = code;
    if (!isDot[id]) trace.record(EXTEND, code, id);

    let branched = false;
    for (const next of adjacent[id]) {
      if (vis[next] === 1) continue;
      if (vis[next] === 2 && next !== ends[code][1]) continue;
      if (branched) deflections[id]++;
      branched = true;
      stack.push([next, code]);
    }
    if (!branched) unwind();
  }

  return {
    solved,
    order: solved ? path.filter((id) => !isDot[id]).map((id) => ({ id, color: grid[id] })) : [],
    ends,
    ...trace.finish(),
  };
}

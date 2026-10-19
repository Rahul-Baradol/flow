import { CONNECT, DISCONNECT, EXTEND, noDots, RETRACT, createTrace, neighbors } from './trace';

// Port of "solver - recursive dfs.cpp": plain brute force. Colors are routed in color order,
// each from its later dot (in reading order) to the other, trying every possible path; a
// layout only counts once all colors connect and no cell is left empty. Nothing is pruned.
//
// Takes and returns the same shapes as solvePruned.
export function solveRecursive(size, pairs) {
  const colors = [];
  const ends = [];
  pairs.forEach((ids, code) => {
    if (ids?.length !== 2) return;
    colors.push(code);
    ends[code] = [Math.max(...ids), Math.min(...ids)];
  });
  if (colors.length === 0) return noDots();

  const adjacent = neighbors(size);
  const vis = new Uint8Array(size * size); // 0 free, 1 on a path, 2 an untouched dot
  const grid = new Uint8Array(size * size); // color in each cell, 0 when empty
  colors.forEach((code) => ends[code].forEach((id) => ((vis[id] = 2), (grid[id] = code))));

  const trace = createTrace();
  const path = []; // cells laid between dots, in order
  let solved = false;

  // colorManager: route the next color, or check the board once every color is connected.
  function route(index) {
    if (index === colors.length) {
      solved = vis.every((v) => v !== 0);
      return;
    }
    const code = colors[index];
    walk(ends[code][0], code, index);
  }

  // solveThisColor: grow `code`'s path into `id` and try every way onward.
  function walk(id, code, index) {
    if (id === ends[code][1]) {
      const prev = vis[id];
      vis[id] = 1;
      trace.record(CONNECT, code);
      route(index + 1);
      if (solved) return;
      trace.record(DISCONNECT, code);
      vis[id] = prev;
      return;
    }

    const isStart = id === ends[code][0];
    const prev = vis[id];
    vis[id] = 1;
    if (!isStart) {
      grid[id] = code;
      path.push(id);
      trace.record(EXTEND, code, id);
    }

    for (const next of adjacent[id]) {
      if (vis[next] === 0 || (vis[next] === 2 && grid[next] === code)) walk(next, code, index);
      if (solved) return;
    }

    if (!isStart) {
      grid[id] = 0;
      path.pop();
      trace.record(RETRACT, code, id);
    }
    vis[id] = prev;
  }

  route(0);

  return {
    solved,
    order: solved ? path.map((id) => ({ id, color: grid[id] })) : [],
    ends,
    ...trace.finish(),
  };
}

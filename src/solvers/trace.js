// Every solver records its search as a trace the board can replay step by step.

// Search steps, as packed into the trace.
export const EXTEND = 0; // a path grows into a cell
export const RETRACT = 1; // it backs out of that cell
export const PRUNE = 2; // it backs out because a dead-end check failed
export const CONNECT = 3; // a path reaches its end dot
export const DISCONNECT = 4; // that connection is undone

// A search can run to millions of steps, so each is packed as type | color << 3 | id << 7
// (3 + 4 + 7 bits: colors up to 15, cell ids up to 127, which covers a 9 x 9 board).
const pack = (type, color, id) => type | (color << 3) | (id << 7);

export function decodeStep(code) {
  return { type: code & 7, color: (code >> 3) & 15, id: code >> 7 };
}

// 2^26 steps is 128 MB of trace; a brute-force search past that stops recording but keeps solving.
export const MAX_STEPS = 1 << 26;

export function createTrace() {
  let steps = new Uint16Array(1024);
  let length = 0;
  let truncated = false;

  return {
    record(type, color, id = 0) {
      if (length === MAX_STEPS) {
        truncated = true;
        return;
      }
      if (length === steps.length) {
        const grown = new Uint16Array(Math.min(steps.length * 2, MAX_STEPS));
        grown.set(steps);
        steps = grown;
      }
      steps[length++] = pack(type, color, id);
    },
    finish() {
      return { trace: steps.subarray(0, length), truncated };
    },
  };
}

// What every solver returns when there is nothing to solve (fresh each time: the trace gets transferred).
export const noDots = () => ({ solved: false, order: [], ends: [], trace: new Uint16Array(0), truncated: false });

// Neighbors of every cell, in the order the C++ solvers try them: up, left, down, right.
export function neighbors(size) {
  return Array.from({ length: size * size }, (_, id) => {
    const row = Math.floor(id / size);
    const col = id % size;
    const out = [];
    if (row > 0) out.push(id - size);
    if (col > 0) out.push(id - 1);
    if (row < size - 1) out.push(id + size);
    if (col < size - 1) out.push(id + 1);
    return out;
  });
}

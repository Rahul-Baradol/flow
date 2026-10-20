import { CONNECT, DISCONNECT, EXTEND, PRUNE, decodeStep } from './solvers/trace';

// Snapshot spacing: any step is rebuilt from the nearest snapshot plus at most this many steps.
const EVERY = 512;

// Replays a solver trace. Each color's path is a stack that grows and shrinks as the search
// moves, so at(step) returns the board after that many steps:
//   { stacks, connected, counts: { tries, backtracks, pruned }, last }
// where last is the decoded step that led there (undefined at step 0). When the trace was
// truncated, its final step shows the solution the search went on to find.
export function createSearchReplay(solution, every = EVERY) {
  const { trace, ends, order, truncated } = solution;
  const snapshots = [];

  const initial = () => ({
    stacks: ends.map(() => []),
    connected: ends.map(() => false),
    counts: { tries: 0, backtracks: 0, pruned: 0 },
  });

  const copy = (state) => ({
    stacks: state.stacks.map((stack) => stack && [...stack]),
    connected: [...state.connected],
    counts: { ...state.counts },
  });

  function apply(state, code) {
    const { type, color, id } = decodeStep(code);
    if (type === EXTEND) {
      state.stacks[color].push(id);
      state.counts.tries++;
    } else if (type === CONNECT) {
      state.connected[color] = true;
    } else if (type === DISCONNECT) {
      state.connected[color] = false;
      state.counts.backtracks++;
    } else {
      state.stacks[color].pop();
      state.counts[type === PRUNE ? 'pruned' : 'backtracks']++;
    }
  }

  const state = initial();
  for (let i = 0; i <= trace.length; i++) {
    if (i % every === 0) snapshots.push(copy(state));
    if (i < trace.length) apply(state, trace[i]);
  }

  return {
    length: trace.length,
    at(step) {
      const base = Math.floor(step / every);
      const result = copy(snapshots[base]);
      for (let i = base * every; i < step; i++) apply(result, trace[i]);
      if (truncated && step === trace.length) {
        result.stacks = ends.map((_, code) => order.filter((cell) => cell.color === code).map((cell) => cell.id));
        result.connected = ends.map(() => true);
      }
      result.last = step > 0 ? decodeStep(trace[step - 1]) : undefined;
      return result;
    },
  };
}

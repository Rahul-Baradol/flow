import { solverById } from './solvers';

// Runs a solver off the main thread so the page stays responsive and the search can be cancelled.
self.onmessage = ({ data: { solver, size, pairs } }) => {
  const started = performance.now();
  const result = solverById(solver).solve(size, pairs);
  result.ms = Math.max(1, Math.round(performance.now() - started));
  self.postMessage(result, [result.trace.buffer]);
};

import { solvePruned } from './pruned';
import { solveRecursive } from './recursive';
import { solveIterative } from './iterative';

// The three solvers from the original C++ project, fastest first.
export const SOLVERS = [
  {
    id: 'pruned',
    name: 'Pruned DFS',
    blurb:
      'Routes the most boxed-in color first and drops any board where another color can no longer connect.',
    solve: solvePruned,
  },
  {
    id: 'recursive',
    name: 'Recursive DFS',
    blurb: 'Brute force: tries every path for each color in turn until the board fills.',
    solve: solveRecursive,
  },
  {
    id: 'iterative',
    name: 'Iterative DFS',
    blurb: 'The same brute force, run on an explicit stack instead of recursion.',
    solve: solveIterative,
  },
];

export const solverById = (id) => SOLVERS.find((solver) => solver.id === id);

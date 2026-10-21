import { COLORS, COLOR_CODES } from './colors';

const MIN_PIPE = 3;
const BACKBITES_PER_CELL = 30;

const neighbors = (id, size) => {
  const r = Math.floor(id / size);
  const c = id % size;
  const out = [];
  if (r > 0) out.push(id - size);
  if (r < size - 1) out.push(id + size);
  if (c > 0) out.push(id - 1);
  if (c < size - 1) out.push(id + 1);
  return out;
};

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// A random path through every cell: start from a snake and apply backbite moves, each of which
// joins an end of the path to one of its neighbors and reverses the stretch in between.
function hamiltonianPath(size) {
  const path = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      path.push(r * size + (r % 2 ? size - 1 - c : c));
    }
  }

  for (let move = 0; move < BACKBITES_PER_CELL * path.length; move++) {
    if (Math.random() < 0.5) {
      path.reverse();
    }
    const head = path[0];
    const choices = neighbors(head, size).filter((id) => id !== path[1]);
    const target = choices[Math.floor(Math.random() * choices.length)];
    const i = path.indexOf(target);
    path.splice(0, i, ...path.slice(0, i).reverse());
  }
  return path;
}

// Splits the path into `count` pipes of at least MIN_PIPE cells each.
function cut(path, count) {
  const lengths = Array(count).fill(MIN_PIPE);
  for (let spare = path.length - MIN_PIPE * count; spare > 0; spare--) lengths[randomInt(0, count - 1)]++;
  const pipes = [];
  let start = 0;
  for (const length of lengths) {
    pipes.push(path.slice(start, start + length));
    start += length;
  }
  return pipes;
}

const adjacent = (a, b, size) => neighbors(a, size).includes(b);

// Builds a random puzzle that is solvable by construction: the pipes it was cut from fill the board.
// Returns pairs in the same shape the board uses, indexed by color code.
export function generatePuzzle(size) {
  const maxColors = Math.min(COLOR_CODES.length, Math.floor((size * size) / MIN_PIPE));
  const count = randomInt(Math.max(2, Math.min(maxColors, size - 1)), Math.min(maxColors, size));

  let pipes;
  // Dots that sit side by side make a pipe trivial, so reshuffle until none do.
  for (let attempt = 0; attempt < 50; attempt++) {
    pipes = cut(hamiltonianPath(size), count);
    if (!pipes.some((pipe) => adjacent(pipe[0], pipe[pipe.length - 1], size))) break;
  }

  const pairs = COLORS.map(() => []);
  pipes.forEach((pipe, i) => (pairs[COLOR_CODES[i]] = [pipe[0], pipe[pipe.length - 1]]));
  return pairs;
}

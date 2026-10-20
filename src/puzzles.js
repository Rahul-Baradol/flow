import { COLORS } from './colors';

// Solvable test puzzles, one per board size, loaded by `npm run test <size>x<size>`.
// First line is "rows cols", then one row per line: '.' is empty, a letter is a dot.
export const PUZZLES = {
  4: `
4 4
R..Y
GBR.
..B.
.GY.`,
  5: `
5 5
R...Y
..B..
..GR.
..O..
B.GOY`,
  6: `
6 6
R.....
....G.
....O.
..Y...
.B.BO.
GY.PPR`,
  7: `
7 7
R.....Y
.......
.....R.
..O.BP.
.G.GC..
.O.C.P.
BV...VY`,
  8: `
8 8
R......Y
........
........
...O..R.
...CGBL.
.GO.CP..
.V..V...
....BPLY`,
  9: `
9 9
B........
.........
...R.....
..A..O...
.....C...
B.OC.P...
G..Y.....
.P...G.A.
.......RY`,
};

// A letter means the color whose name starts with it (R = Red); any other letter takes the
// first color still unused.
export function parsePuzzle(text) {
  const [header, ...rows] = text.trim().split('\n').map((line) => line.trim());
  const [size] = header.split(/\s+/).map(Number);
  const pairs = COLORS.map(() => []);
  const codeOf = {};
  const free = (code) => COLORS[code] && !Object.values(codeOf).includes(code);

  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      if (!(ch in codeOf)) {
        const named = COLORS.findIndex((color, code) => free(code) && color.name[0] === ch);
        codeOf[ch] = named !== -1 ? named : COLORS.findIndex((_, code) => free(code));
      }
      pairs[codeOf[ch]].push(r * size + c);
    })
  );
  return pairs;
}

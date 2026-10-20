import { CONNECT, DISCONNECT, EXTEND, PRUNE, RETRACT, createTrace, noDots } from './trace';

// Port of "solver .cpp": depth-first search that routes one color at a time, starting with the
// most constrained color (fewest free moves at its start), and prunes any board where connected
// component labelling (with a disjoint set) shows some other color can no longer connect.
//
// size  -> board is size x size, cells are numbered row-major (id = row * size + col)
// pairs -> pairs[colorCode] = [startId, endId] for each color code 1..9 that is placed
//
// Returns { solved, order, ends, trace, truncated }:
//   order -> cells between the dots, in the order they were laid down, [{ id, color }]
//   ends  -> ends[colorCode] = [startId, endId] in the direction the path was traced
//   trace -> every step of the search, backtracking included, packed one per Uint16 (see trace.js)
//   truncated -> true when the search outgrew MAX_STEPS and the trace stops early

export function solvePruned(size, pairs) {
  const n = size;
  const m = size;
  const grid = Array.from({ length: n }, () => Array(m).fill(-1));
  const vis = Array.from({ length: n }, () => Array(m).fill(0));

  const dr = [-1, 0, 1, 0];
  const dc = [0, -1, 0, 1];

  const colorX = Array.from({ length: 10 }, () => []);
  const colorY = Array.from({ length: 10 }, () => []);
  const colorsAccToFreeMoves = [];

  let parent = [];
  let solved = 0;

  // Disjoint Set/ Union Find/ Merge Set -> Start
  function intializeDisjointSet(countOfNodes) {
    parent = [];
    for (let i = 0; i <= countOfNodes; i++) {
      parent.push(i);
    }
  }

  function findParent(node) {
    let ultimateParent = node;

    // Finding the ultimate parent
    while (parent[ultimateParent] !== ultimateParent) {
      ultimateParent = parent[ultimateParent];
    }

    // Path compression
    while (parent[node] !== node) {
      let previousNode = parent[node];
      parent[node] = ultimateParent;
      node = previousNode;
    }

    return ultimateParent;
  }

  function Union(x, y) {
    let px = findParent(x);
    let py = findParent(y);
    parent[px] = parent[py];
  }
  // Disjoint Set/ Union Find/ Merge Set -> End

  // Checks if there is a colour which cannot be connected
  function checkForStuckColors(ind) {
    let stuckColorExists = false;

    const checkerGrid = Array.from({ length: n }, () => Array(m).fill(0));
    const labelGrid = Array.from({ length: n }, () => Array(m).fill(0));

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < m; col++) {
        if (vis[row][col] === 0) {
          checkerGrid[row][col] = 1;
        }
      }
    }

    // Initializes the parent list of Disjoint Set
    intializeDisjointSet(n * m);
    let currentLabel = 0;

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < m; col++) {
        if (checkerGrid[row][col] === 0) continue;
        let top = 0;
        let left = 0;

        if (col - 1 >= 0 && checkerGrid[row][col - 1] === 1) {
          left = labelGrid[row][col - 1];
        }

        if (row - 1 >= 0 && checkerGrid[row - 1][col] === 1) {
          top = labelGrid[row - 1][col];
        }

        if (top === 0 && left === 0) {
          currentLabel++;
          labelGrid[row][col] = currentLabel;
        }

        if (top !== 0 && left === 0) {
          labelGrid[row][col] = findParent(top);
        }

        if (top === 0 && left !== 0) {
          labelGrid[row][col] = findParent(left);
        }

        if (top !== 0 && left !== 0) {
          Union(top, left);
          labelGrid[row][col] = findParent(left);
        }
      }
    }

    // Only colours yet to be drawn can get stuck, earlier ones are already complete
    for (let i = ind + 1; i < colorsAccToFreeMoves.length; i++) {
      let color = colorsAccToFreeMoves[i][1];

      let startPosX = colorX[color][0];
      let startPosY = colorY[color][0];

      let endPosX = colorX[color][1];
      let endPosY = colorY[color][1];

      // Adjacent endpoints are already connected
      if (Math.abs(startPosX - endPosX) + Math.abs(startPosY - endPosY) === 1) {
        continue;
      }

      let ok = 0;
      for (let k1 = 0; k1 < 4; k1++) {
        let newStartX = startPosX + dr[k1];
        let newStartY = startPosY + dc[k1];

        if (newStartX < 0 || newStartY < 0 || newStartX >= n || newStartY >= m) continue;
        // Filled cells have no label, so they would all look like one component
        if (vis[newStartX][newStartY] !== 0) continue;

        for (let k2 = 0; k2 < 4; k2++) {
          let newEndX = endPosX + dr[k2];
          let newEndY = endPosY + dc[k2];

          if (newEndX < 0 || newEndY < 0 || newEndX >= n || newEndY >= m) continue;
          if (vis[newEndX][newEndY] !== 0) continue;

          if (findParent(labelGrid[newStartX][newStartY]) === findParent(labelGrid[newEndX][newEndY])) {
            ok = 1;
            break;
          }
        }

        if (ok === 1) break;
      }

      if (ok === 0) {
        stuckColorExists = true;
        break;
      }
    }

    return stuckColorExists;
  }

  // Function which returns true if the current state of the grid is solvable or returns false otherwise
  function performValidityCheck(ind) {
    if (checkForStuckColors(ind)) {
      return false;
    }

    return true;
  }

  // Recursive function which traces the path of a color -> Depth First Search
  let ptr = 0;
  const visitedInOrder = [];
  const trace = createTrace();

  function solvePuzzle(row, col, ind) {
    if (solved === 1) {
      return;
    }

    if (ind === colorsAccToFreeMoves.length) {
      let ok = 1;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          if (vis[i][j] === 0) {
            ok = 0;
            break;
          }
        }
        if (ok === 0) break;
      }

      if (ok === 1) {
        solved = 1;
      }
      return;
    }

    let color = colorsAccToFreeMoves[ind][1];

    let prev = grid[row][col];
    let prevVis = vis[row][col];

    if (colorX[color][1] === row && colorY[color][1] === col) {
      vis[row][col] = 1;
      trace.record(CONNECT, color);

      // Move to next color state
      if (ind + 1 === colorsAccToFreeMoves.length) {
        solvePuzzle(-1, -1, ind + 1);
      } else {
        let newColor = colorsAccToFreeMoves[ind + 1][1];
        let nextRow = colorX[newColor][0];
        let nextCol = colorY[newColor][0];
        solvePuzzle(nextRow, nextCol, ind + 1);
      }
      // End

      if (solved === 1) return;
      trace.record(DISCONNECT, color);
      vis[row][col] = prevVis;
      return;
    }

    vis[row][col] = 1;
    grid[row][col] = color;
    visitedInOrder[ptr++] = [(row * m) + col, color];
    // Starting dots are visited too, but only cells between dots belong in the trace.
    const id = row * m + col;
    if (prevVis !== 2) trace.record(EXTEND, color, id);

    // Checking if the current state of the grid is solvable
    let isValidState = true;

    if (colorsAccToFreeMoves.length >= 3) {
      isValidState = performValidityCheck(ind, color);
    }

    if (!isValidState) {
      if (prevVis !== 2) trace.record(PRUNE, color, id);
      vis[row][col] = prevVis;
      grid[row][col] = prev;

      visitedInOrder[--ptr] = [(row * m) + col, prev];
      return;
    }

    // Continuing with current state of the grid
    for (let i = 0; i < 4; i++) {
      let newRow = row + dr[i];
      let newCol = col + dc[i];
      if (newRow < n && newCol < m && newRow >= 0 && newCol >= 0) {
        if (vis[newRow][newCol] === 0 || (vis[newRow][newCol] === 2 && grid[newRow][newCol] === color)) {
          solvePuzzle(newRow, newCol, ind);
        }

        if (solved === 1) return;
      }
    }

    if (prevVis !== 2) trace.record(RETRACT, color, id);
    grid[row][col] = prev;
    vis[row][col] = prevVis;
    visitedInOrder[--ptr] = [(row * m) + col, prev];
  }

  pairs.forEach((coordinateId, colorCode) => {
    if (!coordinateId || coordinateId.length !== 2) return;
    let [startId, endId] = coordinateId;

    let startX = Math.floor(startId / size);
    let startY = startId % size;

    let endX = Math.floor(endId / size);
    let endY = endId % size;

    grid[startX][startY] = colorCode;
    grid[endX][endY] = colorCode;

    colorX[colorCode].push(startX, endX);
    colorY[colorCode].push(startY, endY);

    vis[startX][startY] = 2;
    vis[endX][endY] = 2;
  });

  // Returns the free moves available at position (r, c)
  let checkFreeMoves = (r, c) => {
    let freeMoves = 0;
    for (let k = 0; k < 4; k++) {
      let newR = r + dr[k];
      let newC = c + dc[k];
      freeMoves += newR >= 0 && newC >= 0 && newR < n && newC < m && (grid[newR][newC] === -1);
    }
    return freeMoves;
  };

  for (let colorCode = 0; colorCode < colorX.length; colorCode++) {
    if (colorX[colorCode].length === 0) continue;
    let r1 = colorX[colorCode][0], c1 = colorY[colorCode][0];
    let r2 = colorX[colorCode][1], c2 = colorY[colorCode][1];

    let freeMoves1 = checkFreeMoves(r1, c1);
    let freeMoves2 = checkFreeMoves(r2, c2);
    if (freeMoves1 > freeMoves2) {
      colorX[colorCode].reverse();
      colorY[colorCode].reverse();
      freeMoves1 = freeMoves2;
    }

    colorsAccToFreeMoves.push([freeMoves1, colorCode]);
  }

  if (colorsAccToFreeMoves.length === 0) {
    return noDots();
  }

  // sorting in ascending order of free moves
  colorsAccToFreeMoves.sort();

  let startColor = colorsAccToFreeMoves[0][1];
  solvePuzzle(colorX[startColor][0], colorY[startColor][0], 0);

  const ends = [];
  for (let colorCode = 0; colorCode < colorX.length; colorCode++) {
    if (colorX[colorCode].length === 0) continue;
    ends[colorCode] = [
      colorX[colorCode][0] * m + colorY[colorCode][0],
      colorX[colorCode][1] * m + colorY[colorCode][1],
    ];
  }

  // The search records each color's starting dot as its first step; only the cells between dots are path.
  const isDot = new Set(ends.flat());

  return {
    solved: solved === 1,
    order: visitedInOrder
      .slice(0, ptr)
      .filter(([id]) => !isDot.has(id))
      .map(([id, color]) => ({ id, color })),
    ends,
    ...trace.finish(),
  };
}

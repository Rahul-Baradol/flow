import React, { useEffect, useState, useRef } from 'react'
import './BoardSolver.css'
import ColorElement from './ColorElement/ColorElement';
import AlertMessage from './AlertMessage/AlertMessage'

export default function BoardSolver(props) {

  useEffect(()=> {
    props.setIsBoard(1);
  })

  let tracePathDelay = 200;
  let size = props.boardSize;
  let val = (props.boardSize === 4 ? "four" : 
              (props.boardSize === 5 ? "five" : 
                (props.boardSize === 6 ? "six" : "unknown")));

    // References to the color elements
    const colorElements = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)
                          ,useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
                        
    // The color selected
    const [currentColor, setCurrentColor] = useState("red");

    // Maintaining the frequency of the colors to avoid frequency more than 2
    const [freqOfColor, setFreqOfColor] = useState(new Map([
        ["red", 0],
        ["yellow", 0],
        ["blue", 0],
        ["green", 0],
        ["orange", 0],
        ["cyan", 0],
        ["pink", 0],
        ["lightgreen", 0],
        ["lightblue", 0]
    ]));
  
    // Coordinates of the colors present on the puzzle grid
    // Unit of coord is ID
    const [coord, setCoord] = useState(new Map([
      ["red", []],
      ["yellow", []],
      ["blue", []],
      ["green", []],
      ["orange", []],
      ["cyan", []],
      ["pink", []],
      ["lightgreen", []],
      ["lightblue", []]
    ]))

    if (val === "unknown") {
      val = "five";
      size = 5;
    }

    // Main clear state
    const [mainClear, setMainClear] = useState(0);

    // Disable Solve Button
    const [disableSolve, setDisableSolve] = useState(0);

    // Disable Clear Button
    const [disableClear, setDisableClear] = useState(0);

    // Ids for color elements in the grid
    let four = [];
    for (let i = 0; i < 16; i++) {
      four.push(i);
    }

    let five = [];
    for (let i = 16; i < 25; i++) {
      five.push(i);
    }

    let six = [];
    for (let i = 25; i < 36; i++) {
      six.push(i);
    }
    
  // ----------------------------------------------- Puzzle Solver ----------------------------------------------- //
  let n = size;
  let m = size;
  let grid = [[-1, -1, -1, -1, -1, -1],
              [-1, -1, -1, -1, -1, -1],
              [-1, -1, -1, -1, -1, -1],
              [-1, -1, -1, -1, -1, -1],
              [-1, -1, -1, -1, -1, -1],
              [-1, -1, -1, -1, -1, -1]];
              
 let vis =    [[0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0],
              [0, 0, 0, 0, 0, 0]];
  
  let parent = []
  
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

  let colorX = [[] , [], [], [], [], [], [], [], [] , [], [], [], [], [], [], [], [] , [], [], [], [], [], [], [], [], []]
  let colorY = [[] , [], [], [], [], [], [], [], [] , [], [], [], [], [], [], [], [] , [], [], [], [], [], [], [], [], []]
  let colorsAccToFreeMoves = [];

  let colorCodeToColor = new Map([
    [0, "white"],
    [1, "red"],
    [2, "yellow"],
    [3, "blue"],
    [4, "green"],
    [5, "orange"],
    [6, "cyan"],
    [7, "pink"],
    [8, "lightgreen"],
    [9, "lightblue"]
  ]);

  let colorToColorCode = new Map([
    ["white", 0],
    ["red", 1],
    ["yellow", 2],
    ["blue", 3],
    ["green", 4],
    ["orange", 5],
    ["cyan", 6],
    ["pink", 7],
    ["lightgreen", 8],
    ["lightblue", 9]
  ]);

  let solved = 0;

  let dr = [-1, 0, 1, 0];
  let dc = [0, -1, 0, 1];

  // Checks if there is a colour which cannot be connected 
  function checkForStuckColors(ind) {
    let stuckColorExists = false;

    let checkerGrid = [[0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      [0, 0, 0, 0, 0, 0, 0, 0, 0]];

    let labelGrid = [[0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0, 0, 0]];

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

        if (col-1 >= 0 && checkerGrid[row][col-1] === 1) {
            left = labelGrid[row][col-1];
        }

        if (row-1 >= 0 && checkerGrid[row-1][col] === 1) {
            top = labelGrid[row-1][col];
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

    colorsAccToFreeMoves.forEach((element)=> {
      let color = element[1];
      if (color !== colorsAccToFreeMoves[ind][1]) {
        let startPosX = colorX[color][0];
        let startPosY = colorY[color][0];
  
        let endPosX = colorX[color][1];
        let endPosY = colorY[color][1];
        
        let ok = 0;
        for (let k1 = 0; k1 < 4; k1++) {
            let newStartX = startPosX + dr[k1];
            let newStartY = startPosY + dc[k1];

            if (newStartX < 0 || newStartY < 0 || newStartX >= n || newStartY >= m) continue;

            for (let k2 = 0; k2 < 4; k2++) {
                let newEndX = endPosX + dr[k2];
                let newEndY = endPosY + dc[k2];

                if (newEndX < 0 || newEndY < 0 || newEndX >= n || newEndY >= m) continue;

                if (findParent(labelGrid[newStartX][newStartY]) === findParent(labelGrid[newEndX][newEndY])) {
                  ok = 1;    
                  break;                
                }
            }

            if (ok === 1) break;
        }

        if (ok === 0) {
          stuckColorExists = true;
        }
      }
    });

    return stuckColorExists;
  }
  
  // Function which returns true if the current state of the grid is solvable or returns false otherwise
  function performValidityCheck(ind) {
    if (checkForStuckColors(ind) === 1) {
      return false;
    }
    
    return true;
  }

  // Recursive function which traces the path of a color -> Depth First Search
  let ptr = 0;
  let visitedInOrder = [[0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"],[0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"],[0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"],[0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"],[0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"],[0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"],[0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"], [0, "white"]];

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
      
      // Move to next color state
        if (ind+1 === colorsAccToFreeMoves.length) {
          solvePuzzle(-1, -1, ind+1);
        } else {
          let newColor = colorsAccToFreeMoves[ind+1][1];
          let nextRow = colorX[newColor][0];
          let nextCol = colorY[newColor][0];
          solvePuzzle(nextRow, nextCol, ind+1);
        }
      // End

      vis[row][col] = prevVis;
      return;
    }

    vis[row][col] = 1;
    grid[row][col] = color;
    visitedInOrder[ptr++] = [(row * m) + col, color];

    // Checking if the current state of the grid is solvable
    let isValidState = true;
    
    if (colorsAccToFreeMoves.length >= 3) {
      isValidState = performValidityCheck(ind, color);
    }

    if (!isValidState) {
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

    grid[row][col] = prev;
    vis[row][col] = prevVis;
    visitedInOrder[--ptr] = [(row * m) + col, prev];
  }

  // Starts Solving the puzzle  
  function main() {
    coord.forEach((coordinateId, color) => {
      if (coordinateId.length === 2) {
        let startId = coordinateId[0], endId = coordinateId[1];
  
        let startX = Math.floor(startId / size);
        let startY = startId % size;
  
        let endX = Math.floor(endId / size);
        let endY = endId % size;
        
        let colorCode = colorToColorCode.get(color);
       
        grid[startX][startY] = colorCode;
        grid[endX][endY] = colorCode;
        
        colorX[colorCode].push(startX);
        colorY[colorCode].push(startY);
        
        colorX[colorCode].push(endX);
        colorY[colorCode].push(endY);

        vis[startX][startY] = 2;
        vis[endX][endY] = 2;
      }
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

    for (let colorCode = 0; colorCode < 26; colorCode++) {
      if (colorX[colorCode].length === 0) continue;
      let r1 = colorX[colorCode][0], c1 = colorY[colorCode][0];
      let r2 = colorX[colorCode][1], c2 = colorY[colorCode][1];

      let freeMoves1 = checkFreeMoves(r1, c1);
      let freeMoves2 = checkFreeMoves(r2, c2);  
      if (freeMoves1 > freeMoves2) {
        let tmp = colorX[colorCode][0];
        colorX[colorCode][0] = colorX[colorCode][1];
        colorX[colorCode][1] = tmp;
        
        tmp = colorY[colorCode][0];
        colorY[colorCode][0] = colorY[colorCode][1];
        colorY[colorCode][1] = tmp;

        tmp = freeMoves1;
        freeMoves1 = freeMoves2;
        freeMoves2 = tmp;
      }

      colorsAccToFreeMoves.push([freeMoves1, colorCode]);
    }
  
    // sorting in ascending order of free moves
    colorsAccToFreeMoves.sort();

    let startColor = colorsAccToFreeMoves[0][1];
    let startX = colorX[startColor][0];
    let startY = colorY[startColor][0];

    solvePuzzle(startX, startY, 0);
  
    if (solved === 0) {
      return;
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        grid[i][j] = colorCodeToColor.get(grid[i][j]);
      }
    }
  }

  // ----------------------------------------------- React Component ----------------------------------------------- //

  return (
    <>
    <main className="main">
      <div className="alertControl">
        <AlertMessage alert={props.alert}></AlertMessage>
      </div>

      <div className="middleContent">
        <div id={val} className="board">
          {
            four.map((value, index) => {
              return <ColorElement reference={colorElements[value]} key={index} id={value} mainClear={mainClear} disableSolve={disableSolve}  coord={coord} setCoord={setCoord} freqOfColor={freqOfColor} setFreqOfColor={setFreqOfColor} color={currentColor} valid={size >= 4}></ColorElement>
            })
          }

          {
            five.map((value, index) => {
              return <ColorElement reference={colorElements[value]} key={index} id={value} mainClear={mainClear} disableSolve={disableSolve}  coord={coord} setCoord={setCoord} freqOfColor={freqOfColor} setFreqOfColor={setFreqOfColor} color={currentColor} valid={size >= 5}></ColorElement>
            })
          }

          {
            six.map((value, index) => {
              return <ColorElement reference={colorElements[value]} key={index} id={value} mainClear={mainClear} disableSolve={disableSolve}  coord={coord} setCoord={setCoord} freqOfColor={freqOfColor} setFreqOfColor={setFreqOfColor} color={currentColor} valid={size >= 6}></ColorElement>
            })
          }
        </div>

        <div className="options">
          <input onClick={()=> setCurrentColor("red")} type="radio" className="btn-check" name="btnradio" id="red" autoComplete="off" defaultChecked/>
          <label id="redLabel" className="option" htmlFor="red"></label>

          <input onClick={()=> setCurrentColor("yellow")} type="radio" className="btn-check" name="btnradio" id="yellow" autoComplete="off"/>
          <label id="yellowLabel" className="option" htmlFor="yellow"></label>

          <input onClick={()=> setCurrentColor("blue")} type="radio" className="btn-check" name="btnradio" id="blue" autoComplete="off"/>
          <label id="blueLabel" className="option" htmlFor="blue"></label>

          <input onClick={()=> setCurrentColor("green")} type="radio" className="btn-check" name="btnradio" id="green" autoComplete="off"/>
          <label id="greenLabel" className="option" htmlFor="green"></label>

          <input onClick={()=> setCurrentColor("orange")} type="radio" className="btn-check" name="btnradio" id="orange" autoComplete="off"/>
          <label id="orangeLabel" className="option" htmlFor="orange"></label>

          <input onClick={()=> setCurrentColor("cyan")} type="radio" className="btn-check" name="btnradio" id="cyan" autoComplete="off"/>
          <label id="cyanLabel" className="option" htmlFor="cyan"></label>

          <input onClick={()=> setCurrentColor("pink")} type="radio" className="btn-check" name="btnradio" id="pink" autoComplete="off"/>
          <label id="pinkLabel" className="option" htmlFor="pink"></label>

          <input onClick={()=> setCurrentColor("lightgreen")} type="radio" className="btn-check" name="btnradio" id="lightgreen" autoComplete="off"/>
          <label id="lightgreenLabel" className="option" htmlFor="lightgreen"></label>

          <input onClick={()=> setCurrentColor("lightblue")} type="radio" className="btn-check" name="btnradio" id="lightblue" autoComplete="off"/>
          <label id="lightblueLabel" className="option" htmlFor="lightblue"></label>
        </div>

      </div>
     
      <div className="actionButtons">
        <button id="solve" type="button" disabled={disableSolve} className="btn btn-outline-primary" onClick={() =>{
          let solve = true;
          let count = 0;
          
          coord.forEach((coordinateId) => {
            if (coordinateId.length % 2) {
              solve = false;
            }
            count += coordinateId.length;
          });
          
          if (solve && count) {
            setDisableSolve(1);
            
            // Starts solving the puzzle
            main();

            props.showAlert(
              solved ? "Puzzle is solved as follows!" : "Could not find the solution to the given puzzle",
              solved ? "success" : "primary",
              1  
            );

            setTimeout(()=> {
              props.showAlert(
                "Click on Clear to clear the board!",
                "primary",
                0
              );
            }, 3000);

            if (solved === 0) return 0;
            
            // Display the solution if it exists
            setDisableClear(1);
            props.setGoToBoard(false);
            props.setGoToAbout(false);
            props.setGoToHome(false);
            
            for (let i = 0; i < size * size; i++) {
              setTimeout(()=>{
                if (colorElements[visitedInOrder[i][0]] != null) {
                  colorElements[visitedInOrder[i][0]].current.style.backgroundColor = `${colorCodeToColor.get(visitedInOrder[i][1])}`;
                }
              }, tracePathDelay * (i+1))
            }

            setTimeout(()=>{
              setDisableClear(0);
              props.setGoToBoard(true);
              props.setGoToAbout(true);
              props.setGoToHome(true);
            }, tracePathDelay * (size * size))

          } else {
            props.showAlert(
              "Enter valid color configuration",
              "warning",
              1
            );
          }
        }}> 
            Solve!
        </button>

        <button disabled={disableClear} id="clear" type="button" className="btn btn-outline-primary" onClick={() =>{
            props.showAlert(
              "Select two position for any color that you pick and lets see if a solution exists in which entire board can be filled connecting two ends of a color!",
              "primary",
              1
            );

            setDisableSolve(0);

            setCoord(new Map([
              ["red", []],
              ["yellow", []],
              ["blue", []],
              ["green", []],
              ["orange", []],
              ["cyan", []],
              ["pink", []],
              ["lightgreen", []],
              ["lightblue", []]
            ]));
            setFreqOfColor(new Map([
              ["red", 0],
              ["yellow", 0],
              ["blue", 0],
              ["green", 0],
              ["orange", 0],
              ["cyan", 0],
              ["pink", 0],
              ["lightgreen", 0],
              ["lightblue", 0]
          ]));
          
          setMainClear(mainClear ^ 1);
          for (let i = 0; i < size * size; i++) {
            // document.getElementById(`${i}`).style.backgroundColor = "#838383";
            colorElements[i].current.style.backgroundColor = "#838383";
          }
          
          grid =  [[-1, -1, -1, -1, -1, -1],
                  [-1, -1, -1, -1, -1, -1],
                  [-1, -1, -1, -1, -1, -1],
                  [-1, -1, -1, -1, -1, -1],
                  [-1, -1, -1, -1, -1, -1],
                  [-1, -1, -1, -1, -1, -1]];
                
          vis =   [[0, 0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0, 0],
                  [0, 0, 0, 0, 0, 0]];
        }}>Clear</button>
      </div>
    </main>
    </>
  )
}
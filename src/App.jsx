import { useState } from "react";
import GridInfo from "./components/GridInfo/GridInfo";
import BoardSolver from "./components/BoardSolver/BoardSolver";
import Navbar from "./components/Navbar/Navbar";
import About from "./components/About/About";
import Home from './components/Home/Home'
import NotFound from "./components/NotFound/NotFound";

import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router-dom'

function App() {
  const [boardSize, setBoardSize] = useState(5);
  const [isBoard, setIsBoard] = useState(0);
  const [isNavBar, setIsNavBar] = useState(0);
  const [alert, setAlert] = useState({
    message: "Select two position for any color that you pick and lets see if a solution exists in which entire board can be filled connecting two ends of a color!",
    type: "primary"
  });

  // Enable/Disable Board, About, Home link states
  const [goToHome, setGoToHome] = useState(1);
  const [goToAbout, setGoToAbout] = useState(1);
  const [goToBoard, setGoToBoard] = useState(1);

  let showAlert = (msg, typ, dismiss) => {
    setAlert({
      message: msg,
      type: typ
    })

    if (dismiss) {
      setTimeout(()=>{
        setAlert({
          message: "Select two position for any color that you pick and lets see if a solution exists in which entire board can be filled connecting two ends of a color!",
          type: "primary"
        });
      }, 3000)
    }
  };

  setTimeout(()=>{
    setIsNavBar(1); 
  }, 3000)

  return (
    <> 
      <BrowserRouter>
        <Navbar boot={isNavBar} isBoard={isBoard} goToHome={goToHome} goToAbout={goToAbout} goToBoard={goToBoard}></Navbar>
        <Routes>
          <Route path="/" element={<Home setIsBoard={setIsBoard}></Home>}></Route>
          <Route path="/board" element={<GridInfo setBoardSize={setBoardSize} setIsBoard={setIsBoard}/>}></Route>
          <Route path="/board/solve" element={
            <BoardSolver setGoToHome={setGoToHome} setGoToAbout={setGoToAbout} setGoToBoard={setGoToBoard} boardSize={boardSize} showAlert={showAlert} alert={alert} setIsBoard={setIsBoard}/>
          }>
          </Route>
          <Route path="/about" element={<About setIsBoard={setIsBoard}/>}></Route>
          <Route path="*" element={<NotFound />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

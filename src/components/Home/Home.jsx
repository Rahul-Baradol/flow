import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

export default function Home(props) {
  const [continueVis, setVisContinue] = useState("none");
  const main = useRef(null);

  useEffect(() => {
    props.setIsBoard(0);
  })

  setTimeout(()=>{
    setVisContinue("flex");
    if (main.current !== null) {
      main.current.className = "main mainAfterEffect";
    }
  }, 4000);

  return (
    <>
    <main ref={main} className="main">
      <div className="heading">Flow Puzzle Solver</div>

      <div id="continueCont" style={{display: `${continueVis}`, animation: "continueFade 1s 1 ease-in"}}>
        <Link className="icon-link icon-link-hover continue" to="/board">
          Continue
          <svg className="bi" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>
        </Link>
      </div>
    </main>
    </>
  )
}

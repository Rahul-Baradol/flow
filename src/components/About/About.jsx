import { React, useEffect } from 'react'
import './About.css'

export default function About(props) {
  useEffect(() => {
    props.setIsBoard(1);
  })

  return (
    <>
    <div className="box">
      <div className="titleBox">
        <div className="text-primary title" id="titlePartFlow">Flow</div>
        <div className="text-primary title" id="titlePartPuzzle">Puzzle</div>
        <div className="text-primary title" id="titlePartSolver">Solver</div>
      </div>

      <div className="card info">
        <div className="card-body">
          <p className="card-text">Have you played Flow Free on mobile? Well this is a small project which solves the puzzles given in Flow Free Game!</p>
        </div>
      </div>

      <div className="linksAbout">
        <div className="card github customCard linkCard">
          <div className="card-body customCard">
            <h5 className="card-title">GitHub</h5>
            <p className="card-text">The source code is available on github. You can check it out!</p>
            <a href="https://github.com/Rahul-Baradol/Flow-Puzzle-Solver-React" rel="noreferrer" target="_blank" className="btn btn-outline-primary customButton">Go to Github</a>
          </div>
        </div>

        <div className="card github customCard linkCard">
          <div className="card-body customCard">
            <h5 className="card-title">About Me!</h5>
            <p className="card-text">Check out my portfolio website to know more about me!</p>
            <a href="https://rahulbaradol.in/" rel="noreferrer" target="_blank" className="btn btn-primary customButton">Checkout my portfolio</a>
          </div>
        </div>
      </div>

    </div>
    </>
  )
}

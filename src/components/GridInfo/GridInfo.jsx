import {React, useEffect} from 'react'
import { Link } from 'react-router-dom'
import './GridInfo.css'

export default function GridInfo(props) {
  useEffect(() => {
    props.setIsBoard(0);
  })

  return (
    <>
    <div className="container text-center customContainer">
      <h1 id="message">Choose the size of the board!</h1>
        <div id="gridInfoContainer">
          <div className="row">
            <Link to="/board/solve">
              <button type="button" className="btn btn-outline-primary customBtns"
                      onClick={()=> {
                          props.setBoardSize(4);
                    }}><h5>4 x 4</h5></button>
              </Link>
          </div>

          <div className="row">
            <Link to="/board/solve">
              <button type="button" className="btn btn-outline-primary customBtns" 
                      onClick={()=> {
                        props.setBoardSize(5);
                  }}><h5>5 x 5</h5></button>
            </Link>
          </div>

          <div className="row">
            <Link to="/board/solve">
              <button type="button" className="btn btn-outline-primary customBtns"
                      onClick={()=> {
                        props.setBoardSize(6);
                  }}><h5>6 x 6</h5></button>
            </Link>
          </div>  
        </div>
    </div>

    </>
  )
}

import React, { useState } from 'react'
import './Navbar.css'
import { Link } from 'react-router-dom'

export default function Navbar(props) {
  const [menuStatus, setMenuStatus] = useState(1); // 1 -> open | 0 -> close

  let toggleMenuStatus = () => {
    setMenuStatus(currentVal => {
      return !currentVal;
    })
  }

  return (
    <>
      <nav style={{opacity: props.boot}} className="navbar navbar-dark navbar-expand-lg bg-primary" id="customNav">
        <Link className="navbar-brand" to={props.goToHome ? "/" : "/board/solve"} id="heading">Flow Puzzle - Solver</Link>
        
        <div id="navigators">
          {props.isBoard ?
              <Link className='links' aria-current="page" to={props.goToBoard ? "/board" : "/board/solve"}>Board</Link>
          : <></>}
        
          <Link className='links' aria-current="page" to={props.goToAbout ? "/about" : "/board/solve"} id="about">About</Link>
        </div>

        <div id="menuContainer">
          {
            menuStatus ? <svg onClick={toggleMenuStatus} version="1.1" className="open" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 54 54" xmlSpace="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <circle style={{fill:"#011c3a"}} cx="27" cy="27" r="27"></circle> <line style={{fill:"none", stroke: "#ffffff", strokeWidth: "2", strokeLinecap: "round", strokeMiterlimit: "10"}} x1="15" y1="16" x2="39" y2="16"></line> <line style={{fill:"none", stroke: "#ffffff", strokeWidth: "2", strokeLinecap: "round", strokeMiterlimit: "10"}} x1="15" y1="27" x2="39" y2="27"></line> <line style={{fill: "none", stroke: "#ffffff", strokeWidth: "2", strokeLinecap: "round", strokeMiterlimit: "10"}} x1="15" y1="38" x2="39" y2="38"></line> </g></svg>
            : <svg onClick={toggleMenuStatus} className="open" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg" transform="matrix(-1, 0, 0, 1, 0, 0)rotate(0)"><g id="SVGRepo_bgCarrier" strokeWidth="0"><rect x="-2.4" y="-2.4" width="28.80" height="28.80" rx="14.4" fill="#011c3a" strokeWidth="0"></rect></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#ffffff" strokeWidth="0.288"></g><g id="SVGRepo_iconCarrier"> <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"></path> <path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round"></path> </g></svg>
          }

          {
            !menuStatus ? 
                <div id="menuNavigators">
                  {props.isBoard ?
                    <Link onClick={toggleMenuStatus} className='links' aria-current="page" to={props.goToBoard ? "/board" : "/board/solve"}>Board</Link>
                  : <></>}
                
                  <Link onClick={toggleMenuStatus} className='links' aria-current="page" to={props.goToAbout ? "/about" : "/board/solve"} id="about">About</Link>
                </div>
            : <></>
          }
        </div>
      </nav>
    </>
  )
}

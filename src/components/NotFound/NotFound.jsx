import React from 'react'
import './NotFound.css'

const NotFound = () => {
  return (
    <>
        <main className="mainNotFound container-lg">
            <div className="unknownmessage">Ohh Snap...</div>
            <div className="unknownmessage" id="unknownMessage">
                Unknown Territory
            </div>
        </main>
    </>
  )
}

export default NotFound
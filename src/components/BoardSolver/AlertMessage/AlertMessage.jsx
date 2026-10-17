import React from 'react'
import './AlertMessage.css'

export default function AlertMessage(props) {
  return (
    <div className="message">
        {props.alert && <div className={`alert alert-${props.alert.type} alert-dismissible fade show message`} id="alertMessage" role="alert">
            {props.alert.message}
        </div>}
    </div>
  )
}

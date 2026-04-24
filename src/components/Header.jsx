import React from 'react'
import './Header.css'

const Header = ({ userEmail, onSignOut }) => {
  return (
    <div className="header-bar">
      <div className="header-content">
        <span className="header-title">Deal Source Tracker</span>
        <div className="user-info">
          <span className="user-label">Signed in as: </span>
          <span className="user-email">{userEmail}</span>
          <button className="sign-out-btn" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header

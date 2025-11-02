import React from 'react';
import './DesktopOnly.css';

function DesktopOnly() {
  return (
    <div className="desktop-only-container">
      <div className="desktop-only-content">
        <h1 className="desktop-only-heading">Desktop Device Required</h1>
        <p className="desktop-only-message">
          This application requires a desktop device to function properly.
        </p>
        <p className="desktop-only-message">
          Please access this site using a desktop or laptop computer.
        </p>
      </div>
    </div>
  );
}

export default DesktopOnly;


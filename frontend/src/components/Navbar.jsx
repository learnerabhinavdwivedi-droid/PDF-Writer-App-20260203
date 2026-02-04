import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">PDF Writer</Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/editor" className="nav-link">Editor</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/auth" className="nav-link">Login</Link>
        </div>
      </div>
    </nav>
  );
}

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className={`site-header ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <div className="brand-left">
        <div className="brand">
          <Link to="https://perspectivepov.co.za/" className="logo-mark" aria-hidden="true">
           <img src="Illustrations/PERES_logo.png" alt="Perspective POV Logo" />
          </Link>
          <div>Perspective point of view</div>
        </div>
      </div>

      <div className="inner" />
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
        onClick={handleToggleMenu}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="nav-right">
        <nav className="site-nav">
          <Link to="https://perspectivepov.co.za/" onClick={handleCloseMenu}>Home</Link>
          <span className="divider">|</span>
          <Link to="/" onClick={handleCloseMenu}>Tools</Link>
          {/* <span className="divider">|</span>
          <a href="#">Sign up</a> */}
        </nav>
      </div>
    </header>


  
  );
}

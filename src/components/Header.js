import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    setIsMenuOpen(false); // Close mobile menu
    navigate(path);
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <Link to="/" className="brand-logo" onClick={() => handleNavClick('/')}>
            <span className="brand-text">ForexRadar7</span>
          </Link>

          <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-item">
              <button
                className="nav-link"
                onClick={() => handleNavClick('/')}
              >
                Home
              </button>
            </div>
            <div className="nav-item">
              <button
                className="nav-link"
                onClick={() => handleNavClick('/broker')}
              >
                Broker
              </button>
            </div>
          </div>

          <button
            className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;

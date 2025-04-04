// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="header-logo">
            <Link to="/">
              <div className="logo-container">
                <div className="logo-icon">FT</div>
                <div className="logo-text">FarmaTech</div>
              </div>
            </Link>
          </div>
          
          <nav className={`header-nav ${menuOpen ? 'menu-open' : ''}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/#features" className="nav-link">Features</Link>
              </li>
              <li className="nav-item">
                <Link to="/about" className="nav-link">About</Link>
              </li>
              <li className="nav-item">
                <Link to="/#" className="nav-link">Verify Your Medicines</Link>
              </li>
              <li className="nav-item mobile-only">
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li className="nav-item mobile-only">
                <Link to="/register" className="nav-link">Register</Link>
              </li>
            </ul>
          </nav>
          
          <div className="header-actions">
            <Link to="/login" className="login-button">Login</Link>
            <Link to="/register" className="register-button">Register</Link>
          </div>
          
          <button 
            className={`mobile-menu-toggle ${menuOpen ? 'active' : ''}`} 
            onClick={toggleMenu}
          >
          </button>
        </div>
      </header>
      <div className="header-spacer"></div>
    </>
  );
};

export default Header;
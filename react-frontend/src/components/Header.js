// src/components/Header.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header className={`home-header ${scrolled ? 'scrolled' : ''}`}
           style={{
             padding: scrolled ? '0.6rem 5%' : '0.8rem 5%',
             boxShadow: scrolled ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
           }}>
      <div className="logo">
        <img
          src="/FarmatechLogo.jpg"
          alt="FarmaTech Logo"
          className="header-logo-image"
        />
      </div>
      <nav className="nav-links">
        <a href="#features">Features</a>
        <Link to="/about">About</Link>
        <a href="#contact">Contact</a>
        <Link to="/register" className="register-btn">
          Register
        </Link>
      </nav>
    </header>
  );
};

export default Header;
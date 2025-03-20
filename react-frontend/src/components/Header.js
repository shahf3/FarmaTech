// src/components/Header.js
import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="home-header">
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
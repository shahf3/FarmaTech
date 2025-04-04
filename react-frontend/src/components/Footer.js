// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="home-footer">
      <div className="footer-content">
        <div className="footer-logo">
<<<<<<< HEAD
          <div className="logo-icon">FT</div>
          <span className="logo-text">FarmaTech</span>
=======
          <span>FarmaTech</span>
>>>>>>> b365264884185a89af44261291a7b3d127a53130
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Platform</h4>
            <Link to="/#features">How it Works</Link>
            <Link to="/#features">Features</Link>
          </div>
          <div className="footer-column">
            <h4>Team</h4>
            <Link to="/about">About Us</Link>
<<<<<<< HEAD
            <Link to="/#blog">Blog</Link>
=======
            <a href="#contact">Contact</a>
            <a href="#">Blog</a>
>>>>>>> b365264884185a89af44261291a7b3d127a53130
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <Link to="/#">Documentation</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 FarmaTech. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
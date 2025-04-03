// src/components/Footer.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="home-footer">
      <div className="footer-content">
        <div className="footer-logo">
          <span>FarmaTech</span>
        </div>
        <div className="footer-links">
          <div className="footer-column">
            <h4>Platform</h4>
            <a href="#features">How it Works</a>
            <a href="#features">Features</a>
            <a href="#">Security</a>
            <a href="#">Pricing</a>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <a href="#contact">Contact</a>
            <a href="#">Blog</a>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API</a>
            <a href="#">Support</a>
            <a href="#">Community</a>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Compliance</a>
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
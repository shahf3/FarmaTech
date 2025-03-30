// src/components/Header.js
import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Header.css";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className={`modern-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-container">
        <div className="header-logo">
          <Link to="/">
            <div className="logo-container">
              <div className="logo-icon">FT</div>
              <span className="logo-text">FarmaTech</span>
            </div>
          </Link>
        </div>

        <nav className={`header-nav ${menuOpen ? "menu-open" : ""}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/" className="nav-link">Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">About</Link>
            </li>
            <li className="nav-item">
              <Link to="/solutions" className="nav-link">Solutions</Link>
            </li>
            <li className="nav-item">
              <Link to="/verify" className="nav-link">Verify Medicine</Link>
            </li>
            {!user ? (
              <>
                <li className="nav-item mobile-only">
                  <Link to="/login" className="nav-link">Login</Link>
                </li>
                <li className="nav-item mobile-only">
                  <Link to="/register" className="nav-link">Register</Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item mobile-only">
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                </li>
                <li className="nav-item mobile-only">
                  <button onClick={handleLogout} className="nav-link logout-btn">
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="header-actions">
          {!user ? (
            <>
              <Link to="/login" className="login-button">Login</Link>
              <Link to="/register" className="register-button">Register</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="dashboard-button">
                Dashboard
              </Link>
              <div className="user-menu">
                <div className="user-avatar">{user.username?.charAt(0) || "U"}</div>
                <div className="user-dropdown">
                  <div className="user-info">
                    <span className="user-name">{user.username || "User"}</span>
                    <span className="user-role">{user.role || "User"}</span>
                  </div>
                  <ul className="dropdown-menu">
                    <li>
                      <Link to="/profile">Profile</Link>
                    </li>
                    <li>
                      <Link to="/settings">Settings</Link>
                    </li>
                    <li>
                      <button onClick={handleLogout}>Logout</button>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <button 
          className={`mobile-menu-toggle ${menuOpen ? "active" : ""}`} 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
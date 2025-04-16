import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(
      localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") && prefersDarkMode)
    );

    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-theme",
      newTheme ? "dark" : "light"
    );
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className={`header ${isScrolled ? "scrolled" : ""}`}>
        <Link to="/" className="header-logo">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          FarmaTech
        </Link>

        <nav className={`nav-links ${mobileMenuOpen ? "mobile-active" : ""}`}>
          <Link to="/pharmaceutical-info" className="nav-link">
            Features
          </Link>
          <Link to="/about" className="nav-link">
            About Us
          </Link>
          <Link to="/verify" className="nav-link">
            Verify Your Medicines
          </Link>
        </nav>

        <div className="nav-auth">
          <button
            className="theme-toggle-header"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>

        <button 
          className={`mobile-menu-btn ${mobileMenuOpen ? "active" : ""}`} 
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <nav className="mobile-nav">
            <Link
              to="/pharmaceutical-info"
              className="mobile-nav-link"
              onClick={toggleMobileMenu}
            >
              Features
            </Link>
            <Link
              to="/about"
              className="mobile-nav-link"
              onClick={toggleMobileMenu}
            >
              About Us
            </Link>
            <Link
              to="/verify"
              className="mobile-nav-link"
              onClick={toggleMobileMenu}
            >
              Verify Your Medicines
            </Link>

            <div className="mobile-nav-auth">
              <button className="theme-toggle-mobile" onClick={toggleTheme}>
                {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>
              <Link
                to="/login"
                className="mobile-nav-link"
                onClick={toggleMobileMenu}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="primary-btn"
                onClick={toggleMobileMenu}
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default Header;
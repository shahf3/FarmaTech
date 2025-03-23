// src/components/Home.js
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Header from "./Header";
import "../styles/Home.css";
import Footer from "./Footer";

const Home = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [activeFeature, setActiveFeature] = useState(0);
  const { login, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  // Auto-rotate features every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(formData.username, formData.password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const features = [
    {
      title: "Secure Medicine Verification",
      description:
        "Verify the authenticity of medicines using blockchain technology to ensure patient safety.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
    },
    {
      title: "End-to-End Supply Chain Tracking",
      description:
        "Monitor medicines from manufacturer to patient with immutable blockchain records.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6"></path>
          <circle cx="19" cy="12" r="3"></circle>
          <circle cx="5" cy="12" r="3"></circle>
        </svg>
      ),
    },
    {
      title: "Multi-Stakeholder Platform",
      description:
        "Connect manufacturers, distributors, regulators, and end users on a single trusted platform.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
          <path d="M16 3.13a4 4 0 010 7.75"></path>
        </svg>
      ),
    },
    {
      title: "Counterfeit Detection",
      description:
        "Identify and flag counterfeit medicines before they reach patients, protecting public health.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      ),
    },
  ];

  return (
    <div className="home-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Using the Header component */}
      <Header />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Secure Medicine Authentication with Blockchain</h1>
          <p>
            FarmaTech uses blockchain technology to ensure the integrity and
            authenticity of pharmaceutical products throughout the supply chain.
          </p>
          <div className="hero-buttons">
            <a href="#features" className="primary-btn">
              Learn More
            </a>
            <Link to="/register" className="secondary-btn">
              Join FarmaTech
            </Link>
          </div>
        </div>

        <div className="login-card">
          <h2>Sign In</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter your username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="auth-links">
            <p>
              New to FarmaTech? <Link to="/register">Create Account</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2>Blockchain-Powered Medicine Security</h2>
        <div className="features-container">
          <div className="features-carousel">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card ${
                  index === activeFeature ? "active" : ""
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="feature-indicators">
            {features.map((_, index) => (
              <button
                key={index}
                className={index === activeFeature ? "active" : ""}
                onClick={() => setActiveFeature(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2>How FarmaTech Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Medicine Registration</h3>
            <p>
              Manufacturers register medicines with unique identifiers on the
              blockchain.
            </p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Supply Chain Tracking</h3>
            <p>
              Distributors update the blockchain as medicines move through the
              supply chain.
            </p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Regulatory Oversight</h3>
            <p>
              Regulators monitor the blockchain for compliance and quality
              assurance.
            </p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Consumer Verification</h3>
            <p>
              End users verify medicine authenticity before use, ensuring
              safety.
            </p>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="user-types">
        <h2>Who Uses FarmaTech</h2>
        <div className="user-types-grid">
          <div className="user-type">
            <div className="user-icon manufacturer-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 21V10m0 0L8 14m4-4l4 4"></path>
                <path d="M20 16.2V7.8a2 2 0 00-1-1.73l-7-4.02a2 2 0 00-2 0l-7 4.02a2 2 0 00-1 1.73v8.4a2 2 0 001 1.73l7 4.02a2 2 0 002 0l7-4.02a2 2 0 001-1.73z"></path>
              </svg>
            </div>
            <h3>Manufacturers</h3>
            <p>
              Register medicines, generate secure identifiers, and initiate the
              supply chain.
            </p>
          </div>
          <div className="user-type">
            <div className="user-icon distributor-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <h3>Distributors</h3>
            <p>
              Update medicine status, track conditions, and maintain supply
              chain integrity.
            </p>
          </div>
          <div className="user-type">
            <div className="user-icon regulator-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h3>Regulators</h3>
            <p>
              Monitor compliance, investigate issues, and ensure public health
              standards.
            </p>
          </div>
          <div className="user-type">
            <div className="user-icon enduser-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3>End Users</h3>
            <p>
              Verify medicine authenticity, check supply chain history, and
              ensure safety.
            </p>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Join the FarmaTech Network</h2>
          <p>
            Be part of the solution to ensure pharmaceutical safety and
            integrity.
          </p>
          <Link to="/register" className="cta-button">
            Create Account
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;
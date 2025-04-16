import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Home.css";
import "../styles/MobileMenu.css";
import Header from "./Header";
import Footer from "./Footer";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [activeFeature, setActiveFeature] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { login, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const sectionsRef = useRef([]);
  const shapesRef = useRef([]);
  const heroRef = useRef(null);
  const loginCardRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    const sections = document.querySelectorAll("section");
    sections.forEach((section) => {
      section.classList.add("reveal");
    });

    document
      .querySelectorAll(".feature-card, .user-type, .testimonial-card, .step")
      .forEach((item) => {
        item.classList.add("reveal");
      });

    window.addEventListener("scroll", handleScrollAnimations);

    handleScrollAnimations();
    initTiltEffect();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScrollAnimations);

      document.querySelectorAll(".tilt-card").forEach((card) => {
        card.removeEventListener("mousemove", handleTiltMove);
        card.removeEventListener("mouseleave", handleTiltReset);
      });
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3);
    }, 7000);
    return () => clearInterval(testimonialInterval);
  }, []);

  const initTiltEffect = () => {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("mousemove", handleTiltMove);
      card.addEventListener("mouseleave", handleTiltReset);
    });
  };

  const handleTiltMove = (e) => {
    const card = e.currentTarget;
    const cardRect = card.getBoundingClientRect();
    const centerX = cardRect.left + cardRect.width / 2;
    const centerY = cardRect.top + cardRect.height / 2;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const offsetX = ((mouseX - centerX) / (cardRect.width / 2)) * 10;
    const offsetY = ((mouseY - centerY) / (cardRect.height / 2)) * 10;

    card.style.transform = `perspective(1000px) rotateX(${-offsetY}deg) rotateY(${offsetX}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleTiltReset = (e) => {
    e.currentTarget.style.transform =
      "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
    e.currentTarget.style.transition = "transform 0.5s ease";
  };

  const handleScrollAnimations = () => {
    setIsScrolled(window.scrollY > 50);

    const revealElements = document.querySelectorAll(".reveal");

    revealElements.forEach((element, index) => {
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      const delay = index * 0.1;

      if (elementTop < windowHeight - 80) {
        setTimeout(() => {
          element.classList.add("active");
        }, delay * 1000);
      }
    });

    const shapes = document.querySelectorAll(".shape");
    const scrollPosition = window.scrollY;

    shapes.forEach((shape, index) => {
      const speed = 0.1 * (index + 1);
      const rotation = scrollPosition * 0.02 * (index + 1);
      if (shape) {
        shape.style.transform = `translateY(${
          scrollPosition * speed
        }px) rotate(${rotation}deg)`;
      }
    });

    if (heroRef.current) {
      const heroSpeed = 0.4;
      heroRef.current.style.backgroundPositionY = `${
        scrollPosition * heroSpeed
      }px`;
    }
  };

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.username, formData.password, formData.rememberMe);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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

  const advantages = [
    {
      text: "Reduced counterfeit medicine risks",
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
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    },
    {
      text: "Enhanced supply chain visibility",
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
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ),
    },
    {
      text: "Improved regulatory compliance",
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
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      ),
    },
    {
      text: "Real-time tracking capabilities",
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
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      ),
    },
    {
      text: "Enhanced consumer confidence",
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
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
      ),
    },
  ];

  const testimonials = [
    {
      quote:
        "FarmaTech has revolutionized how we track our products from production to pharmacy. The platform is intuitive and provides peace of mind.",
      name: "Jane Doe",
      position: "Supply Chain Director, PharmaGlobal",
      avatar: "JD",
      color: "#1DCD9F",
    },
    {
      quote:
        "The real-time tracking and verification capabilities have helped us identify and prevent multiple counterfeit incidents.",
      name: "John Smith",
      position: "Regulatory Affairs, MediTrust",
      avatar: "JS",
      color: "#169976",
    },
    {
      quote:
        "As a healthcare provider, I can now verify medication authenticity with a simple scan, improving patient safety significantly.",
      name: "Amina Sadiq",
      position: "Chief Pharmacist, Central Hospital",
      avatar: "AS",
      color: "#0d5d48",
    },
  ];

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader-circle"></div>
        <div className="loader-text">Loading FarmaTech</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Header isScrolled={isScrolled} />

      <div className="animated-bg">
        <motion.div
          className="shape shape-1"
          ref={(el) => (shapesRef.current[0] = el)}
        />
        <motion.div
          className="shape shape-2"
          ref={(el) => (shapesRef.current[1] = el)}
        />
        <motion.div
          className="shape shape-3"
          ref={(el) => (shapesRef.current[2] = el)}
        />
        <motion.div
          className="shape shape-4"
        />
      </div>

      <section className="hero-section-fullwidth" ref={heroRef}>
        {/* Animated Background Elements */}
        <div className="hero-bg-elements">
          <div className="star-field">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="star"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0.1 + Math.random() * 0.5,
                  scale: 0.3 + Math.random() * 0.7,
                }}
                animate={{
                  opacity: [
                    0.1 + Math.random() * 0.5,
                    0.5 + Math.random() * 0.5,
                    0.1 + Math.random() * 0.5,
                  ],
                  scale: [
                    0.3 + Math.random() * 0.7,
                    0.5 + Math.random() * 0.8,
                    0.3 + Math.random() * 0.7,
                  ],
                }}
                transition={{
                  duration: 3 + Math.random() * 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>

          <div className="grid-pattern"></div>
        </div>

        {/* Left Content Area */}
        <motion.div
          className="hero-banner"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="badge-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            Pharmaceutical Blockchain
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            Secure Medicine <span className="highlight">Authentication</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
          >
            Ensure the authenticity and integrity of medicines throughout the
            supply chain with our blockchain-based verification platform.
            Protect patients, enhance compliance, and eliminate counterfeits.
          </motion.p>

          <div className="advantages-list">
            {advantages.map((advantage, index) => (
              <motion.div
                key={index}
                className="advantage-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                whileHover={{
                  x: 8,
                  backgroundColor: "rgba(29, 205, 159, 0.15)",
                  transition: { duration: 0.2 },
                }}
              >
                <div className="advantage-icon">{advantage.icon}</div>
                <span>{advantage.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5 }}
          >
            <motion.button
              className="primary-btn"
              onClick={scrollToFeatures}
              whileHover={{
                y: -5,
                boxShadow: "0 10px 25px rgba(29, 205, 159, 0.4)",
              }}
              whileTap={{ y: 2 }}
            >
              Learn More
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="arrow-icon"
              >
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
              </svg>
            </motion.button>

            <motion.a
              href="#demo"
              className="secondary-btn"
              whileHover={{
                y: -5,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              }}
              whileTap={{ y: 2 }}
            >
              Request Demo
            </motion.a>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.7 }}
          >
            <div className="stat-item">
              <motion.div
                className="stat-number"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7, duration: 0.5 }}
              >
                200+
              </motion.div>
              <div className="stat-label">Partners</div>
            </div>
            <div className="stat-item">
              <motion.div
                className="stat-number"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.5 }}
              >
                99.9%
              </motion.div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-item">
              <motion.div
                className="stat-number"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9, duration: 0.5 }}
              >
                10M+
              </motion.div>
              <div className="stat-label">Verifications</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="login-card-enhanced"
          ref={loginCardRef}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <div className="card-glow"></div>

          <div className="login-card-header">
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Sign In to <span className="brand-text">FarmaTech</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Access your secure dashboard
            </motion.p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="login-form"
          >
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <div className="input-container">
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label-container">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <a href="/forgot-password" className="forgot-password">
                  Forgot?
                </a>
              </div>
              <div className="input-container">
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                >
                  {isPasswordVisible ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                      <line x1="3" y1="3" x2="21" y2="21"></line>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="login-btn"
              disabled={loading}
              whileHover={{
                y: -3,
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.2)",
              }}
              whileTap={{ y: 2 }}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg
                    className="btn-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                </>
              )}
            </motion.button>

            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <svg
                  className="error-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </motion.div>
            )}
          </motion.form>

          <div className="auth-links">
            <p>
              Are you a manufacturer?{" "}
              <Link to="/register" className="auth-link">
                Create Account
              </Link>
            </p>
          </div>

          {/* Floating particles effect in login card */}
          <div className="login-particles">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                initial={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  opacity: 0.3 + Math.random() * 0.4,
                  scale: 0.5 + Math.random() * 0.5,
                }}
                animate={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  opacity: 0.3 + Math.random() * 0.4,
                  scale: 0.5 + Math.random() * 0.5,
                }}
                transition={{
                  duration: 15 + Math.random() * 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="hero-decorative-elements">
          <div className="floating-dots">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="floating-dot"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * 500,
                  opacity: 0.3 + Math.random() * 0.7,
                }}
                animate={{
                  y: [
                    Math.random() * 500,
                    Math.random() * 500 - 50,
                    Math.random() * 500,
                  ],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="features-section"
        ref={(el) => (sectionsRef.current[1] = el)}
      >
        <div className="section-header">
          <motion.span
            className="section-badge"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Core Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Blockchain-Powered Medicine Security
          </motion.h2>
          <motion.p
            className="section-description"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Our platform provides end-to-end solutions to ensure pharmaceutical
            supply chain integrity
          </motion.p>
        </div>

        <div className="features-container">
          <div className="features-carousel">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`feature-card tilt-card ${
                  index === activeFeature ? "active" : ""
                }`}
                onClick={() => setActiveFeature(index)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{
                  y: -10,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                <motion.div
                  className="feature-icon"
                  whileHover={{ rotate: 5, scale: 1.1 }}
                >
                  {feature.icon}
                </motion.div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="learn-more">Learn more →</span>

                <div className="feature-border"></div>
              </motion.div>
            ))}
          </div>

          <div className="feature-indicators">
            {features.map((_, index) => (
              <motion.button
                key={index}
                className={index === activeFeature ? "active" : ""}
                onClick={() => setActiveFeature(index)}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
                animate={
                  index === activeFeature
                    ? {
                        scale: [1, 1.2, 1],
                        transition: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
                aria-label={`View feature ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className="how-it-works"
        ref={(el) => (sectionsRef.current[2] = el)}
      >
        <div className="section-header">
          <motion.span
            className="section-badge"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            How FarmaTech Works
          </motion.h2>
          <motion.p
            className="section-description"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Our streamlined process ensures pharmaceutical integrity from
            production to patient
          </motion.p>
        </div>

        {/* Enhanced 3D Supply Chain Animation */}
        <motion.div
          className="enhanced-supply-chain-animation"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="chain-3d-container">
            <div className="chain-3d-perspective">
              <motion.div
                className="chain-3d-path"
                animate={{
                  rotateX: [0, 5, 0, -5, 0],
                  rotateY: [0, -5, 0, 5, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.div
                  className="path-pulse"
                  animate={{
                    x: ["0%", "100%"],
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* Chain Stations */}
                <motion.div
                  className="chain-station chain-station-1"
                  whileHover={{
                    scale: 1.2,
                    boxShadow: "0 0 25px rgba(29, 205, 159, 0.7)",
                    z: 50,
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                      "0 0 20px rgba(29, 205, 159, 0.6)",
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                    ],
                    z: [0, 20, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    scale: { type: "spring", stiffness: 400, damping: 10 },
                  }}
                >
                  <div className="station-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 21V10m0 0L8 14m4-4l4 4"></path>
                      <path d="M20 16.2V7.8a2 2 0 00-1-1.73l-7-4.02a2 2 0 00-2 0l-7 4.02a2 2 0 00-1 1.73v8.4a2 2 0 001 1.73l7 4.02a2 2 0 002 0l7-4.02a2 2 0 001-1.73z"></path>
                    </svg>
                  </div>
                  <div className="station-label">Manufacturer</div>
                  <div className="station-tooltip">
                    <h4>Step 1: Medicine Registration</h4>
                    <p>
                      Manufacturers register products with unique blockchain
                      identifiers
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="chain-station chain-station-2"
                  whileHover={{
                    scale: 1.2,
                    boxShadow: "0 0 25px rgba(29, 205, 159, 0.7)",
                    z: 50,
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                      "0 0 20px rgba(29, 205, 159, 0.6)",
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                    ],
                    z: [0, 20, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 0.5,
                    scale: { type: "spring", stiffness: 400, damping: 10 },
                  }}
                >
                  <div className="station-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                  </div>
                  <div className="station-label">Distributor</div>
                  <div className="station-tooltip">
                    <h4>Step 2: Supply Chain Tracking</h4>
                    <p>
                      Distributors update status as medicines move through the
                      supply chain
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="chain-station chain-station-3"
                  whileHover={{
                    scale: 1.2,
                    boxShadow: "0 0 25px rgba(29, 205, 159, 0.7)",
                    z: 50,
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                      "0 0 20px rgba(29, 205, 159, 0.6)",
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                    ],
                    z: [0, 20, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 1,
                    scale: { type: "spring", stiffness: 400, damping: 10 },
                  }}
                >
                  <div className="station-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                  </div>
                  <div className="station-label">Regulator</div>
                  <div className="station-tooltip">
                    <h4>Step 3: Regulatory Oversight</h4>
                    <p>
                      Regulators monitor blockchain data for compliance and
                      quality assurance
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="chain-station chain-station-4"
                  whileHover={{
                    scale: 1.2,
                    boxShadow: "0 0 25px rgba(29, 205, 159, 0.7)",
                    z: 50,
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                      "0 0 20px rgba(29, 205, 159, 0.6)",
                      "0 0 5px rgba(29, 205, 159, 0.3)",
                    ],
                    z: [0, 20, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: 1.5,
                    scale: { type: "spring", stiffness: 400, damping: 10 },
                  }}
                >
                  <div className="station-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="station-label">Patient</div>
                  <div className="station-tooltip">
                    <h4>Step 4: Consumer Verification</h4>
                    <p>
                      End users verify medicine authenticity before use with a
                      simple scan
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="enhanced-truck"
                  animate={{
                    left: ["10%", "37%", "64%", "90%", "10%"],
                    rotateY: [
                      "0deg",
                      "0deg",
                      "0deg",
                      "0deg",
                      "180deg",
                      "180deg",
                      "180deg",
                      "180deg",
                      "0deg",
                    ],
                    z: [0, 20, 30, 20, 0, 20, 30, 20, 0],
                  }}
                  transition={{
                    times: [0, 0.25, 0.5, 0.75, 0.76, 0.77, 0.78, 0.99, 1],
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="truck-model">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <div className="truck-shadow"></div>
                  </div>
                </motion.div>

                <motion.div
                  className="data-pill data-pill-1"
                  animate={{
                    left: ["10%", "37%", "37%", "37%", "10%"],
                    opacity: [0, 1, 1, 0, 0],
                    scale: [0.5, 1, 1, 0.5, 0.5],
                    y: ["0%", "-100%", "-50%", "0%", "0%"],
                    z: [0, 30, 30, 0, 0],
                  }}
                  transition={{
                    times: [0, 0.3, 0.5, 0.7, 1],
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <span className="pill-label">ID: 98F2A</span>
                </motion.div>

                <motion.div
                  className="data-pill data-pill-2"
                  animate={{
                    left: ["37%", "64%", "64%", "64%", "37%"],
                    opacity: [0, 1, 1, 0, 0],
                    scale: [0.5, 1, 1, 0.5, 0.5],
                    y: ["0%", "-100%", "-50%", "0%", "0%"],
                    z: [0, 30, 30, 0, 0],
                  }}
                  transition={{
                    times: [0, 0.3, 0.5, 0.7, 1],
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1.7,
                  }}
                >
                  <span className="pill-label">Verified</span>
                </motion.div>

                <motion.div
                  className="data-pill data-pill-3"
                  animate={{
                    left: ["64%", "90%", "90%", "90%", "64%"],
                    opacity: [0, 1, 1, 0, 0],
                    scale: [0.5, 1, 1, 0.5, 0.5],
                    y: ["0%", "-100%", "-50%", "0%", "0%"],
                    z: [0, 30, 30, 0, 0],
                  }}
                  transition={{
                    times: [0, 0.3, 0.5, 0.7, 1],
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 3.4,
                  }}
                >
                  <span className="pill-label">Authentic</span>
                </motion.div>

                {/* Network Connections */}
                <div className="blockchain-network">
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="network-node"
                      initial={{
                        x: Math.random() * 100 - 50 + "%",
                        y: Math.random() * 100 - 50 + "%",
                        opacity: 0.3 + Math.random() * 0.5,
                        scale: 0.5 + Math.random() * 0.5,
                      }}
                      animate={{
                        x: Math.random() * 100 - 50 + "%",
                        y: Math.random() * 100 - 50 + "%",
                        opacity: [0.3, 0.7, 0.3],
                        scale: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 10 + Math.random() * 15,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="network-connection"
                      initial={{
                        x1: Math.random() * 100 + "%",
                        y1: Math.random() * 100 + "%",
                        x2: Math.random() * 100 + "%",
                        y2: Math.random() * 100 + "%",
                        opacity: 0.1 + Math.random() * 0.2,
                      }}
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Interactive Legend */}
          <div className="process-legend">
            <motion.div
              className="legend-item"
              whileHover={{ x: 5, backgroundColor: "rgba(29, 205, 159, 0.1)" }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="legend-icon">1</div>
              <div className="legend-text">
                <h4>Medicine Registration</h4>
                <p>Unique blockchain identifiers assigned</p>
              </div>
            </motion.div>

            <motion.div
              className="legend-item"
              whileHover={{ x: 5, backgroundColor: "rgba(29, 205, 159, 0.1)" }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="legend-icon">2</div>
              <div className="legend-text">
                <h4>Supply Chain Tracking</h4>
                <p>Real-time monitoring of medicine movement</p>
              </div>
            </motion.div>

            <motion.div
              className="legend-item"
              whileHover={{ x: 5, backgroundColor: "rgba(29, 205, 159, 0.1)" }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="legend-icon">3</div>
              <div className="legend-text">
                <h4>Regulatory Oversight</h4>
                <p>Authorities verify compliance in real-time</p>
              </div>
            </motion.div>

            <motion.div
              className="legend-item"
              whileHover={{ x: 5, backgroundColor: "rgba(29, 205, 159, 0.1)" }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="legend-icon">4</div>
              <div className="legend-text">
                <h4>Consumer Verification</h4>
                <p>Patients confirm authenticity via mobile app</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="blockchain-benefits">
          <motion.h3
            className="benefits-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Blockchain Technology Benefits
          </motion.h3>

          <div className="benefits-grid">
            <motion.div
              className="benefit-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h4>Immutable Records</h4>
              <p>
                Once recorded, data cannot be altered, ensuring trustworthy
                medicine history
              </p>
            </motion.div>

            <motion.div
              className="benefit-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <h4>Complete Transparency</h4>
              <p>
                All stakeholders have visibility into the entire supply chain
                process
              </p>
            </motion.div>

            <motion.div
              className="benefit-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h4>Real-time Tracking</h4>
              <p>
                Monitor medicine location and condition instantly at any point
                in the supply chain
              </p>
            </motion.div>

            <motion.div
              className="benefit-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="benefit-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h4>Enhanced Security</h4>
              <p>
                Cryptographic verification prevents counterfeiting and
                unauthorized alterations
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="app-showcase"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="app-content">
            <motion.h3
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Verify In Seconds
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Our mobile application allows anyone to instantly verify medicine
              authenticity with a simple scan
            </motion.p>

            <motion.ul
              className="app-features-list"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <li>
                <span className="check-icon">✓</span>
                QR code & barcode scanning
              </li>
              <li>
                <span className="check-icon">✓</span>
                Instant verification results
              </li>
              <li>
                <span className="check-icon">✓</span>
                Complete medicine history
              </li>
              <li>
                <span className="check-icon">✓</span>
                Works offline in remote areas
              </li>
            </motion.ul>

            <Link to="/verify" style={{ textDecoration: "none" }}>
              <motion.button
                className="download-btn"
                whileHover={{
                  y: -5,
                  boxShadow: "0 10px 25px rgba(29, 205, 159, 0.4)",
                }}
                whileTap={{ y: 2 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
              >
                Scan & Confirm!
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 6.75 12 3m0 0 3.75 3.75M12 3v18"
                  />
                </svg>
              </motion.button>
            </Link>
          </div>

          <div className="app-visual">
            <motion.div
              className="phone-mockup"
              initial={{ opacity: 0, y: 50, rotateY: -20 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              animate={{
                y: [0, -15, 0],
                rotateY: [0, 5, 0],
                rotateZ: [0, 2, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
                opacity: { duration: 0.8, delay: 0.3 },
                y: { type: "spring", stiffness: 100, damping: 15 },
              }}
            >
              <div className="phone-screen">
                <div className="app-interface">
                  <div className="app-header">
                    <div className="app-logo">FarmaTech</div>
                  </div>
                  <div className="scan-area">
                    <div className="scan-animation"></div>
                    <div className="scan-corners">
                      <div className="corner corner-tl"></div>
                      <div className="corner corner-tr"></div>
                      <div className="corner corner-bl"></div>
                      <div className="corner corner-br"></div>
                    </div>
                  </div>
                  <div className="verification-result">
                    <div className="result-icon">✓</div>
                    <div className="result-text">Authentic</div>
                    <div className="medicine-info">
                      <div className="info-row">
                        <span className="info-label">Product:</span>
                        <span className="info-value">Amoxicillin 500mg</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Batch:</span>
                        <span className="info-value">LT294628A</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Expiry:</span>
                        <span className="info-value">06/2025</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="phone-notch"></div>
              <div className="phone-button"></div>
              <div className="phone-reflection"></div>
            </motion.div>
          </div>
        </motion.div>

        {/* Case Study Section */}
        <div className="case-study">
          <motion.div
            className="case-study-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="case-study-badge">Case Study</div>
            <h3>80% Reduction in Counterfeit Medicine</h3>
            <p>
              In a pilot program across 5 countries, FarmaTech's blockchain
              verification system helped identify and prevent distribution of
              fake medications, protecting thousands of patients.
            </p>
            <motion.a
              href="/case-studies"
              className="case-study-link"
              whileHover={{ x: 10 }}
            >
              Read full case study →
            </motion.a>
          </motion.div>

          <motion.div
            className="case-study-stats"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="stat-card">
              <div className="stat-value">80%</div>
              <div className="stat-label">Reduction in counterfeits</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">12k+</div>
              <div className="stat-label">Suspect medicines identified</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">99.8%</div>
              <div className="stat-label">Verification accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">5</div>
              <div className="stat-label">Countries in pilot program</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        className="user-types"
        ref={(el) => (sectionsRef.current[3] = el)}
      >
        <div className="section-header">
          <motion.span
            className="section-badge"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Stakeholders
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Who Uses FarmaTech
          </motion.h2>
          <motion.p
            className="section-description"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Our platform connects all pharmaceutical stakeholders in a secure
            ecosystem
          </motion.p>
        </div>

        <div className="user-types-grid">
          <motion.div
            className="user-type tilt-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{
              y: -10,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <motion.div
              className="user-icon manufacturer-icon"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
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
            </motion.div>
            <h3>Manufacturers</h3>
            <p>
              Register medicines, generate secure identifiers, and initiate the
              supply chain process.
            </p>
            <motion.div whileHover={{ x: 5 }} className="link-container">
              <Link to="/solutions/manufacturers" className="user-type-link">
                Learn more →
              </Link>
            </motion.div>

            <div className="card-particles">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="card-particle"
                  animate={{
                    x: [0, Math.random() * 30 - 15],
                    y: [0, Math.random() * 30 - 15],
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            className="user-type tilt-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{
              y: -10,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <motion.div
              className="user-icon distributor-icon"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
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
            </motion.div>
            <h3>Distributors</h3>
            <p>
              Update medicine status, track conditions, and maintain supply
              chain integrity.
            </p>
            <motion.div whileHover={{ x: 5 }} className="link-container">
              <Link to="/solutions/distributors" className="user-type-link">
                Learn more →
              </Link>
            </motion.div>

            <div className="card-particles">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="card-particle"
                  animate={{
                    x: [0, Math.random() * 30 - 15],
                    y: [0, Math.random() * 30 - 15],
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Regulator Card */}
          <motion.div
            className="user-type tilt-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{
              y: -10,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <motion.div
              className="user-icon regulator-icon"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
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
            </motion.div>
            <h3>Regulators</h3>
            <p>
              Monitor compliance, investigate issues, and ensure public health
              standards are maintained.
            </p>
            <motion.div whileHover={{ x: 5 }} className="link-container">
              <Link to="/solutions/regulators" className="user-type-link">
                Learn more →
              </Link>
            </motion.div>

            {/* Interactive particles */}
            <div className="card-particles">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="card-particle"
                  animate={{
                    x: [0, Math.random() * 30 - 15],
                    y: [0, Math.random() * 30 - 15],
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* End User Card */}
          <motion.div
            className="user-type tilt-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true, margin: "-50px" }}
            whileHover={{
              y: -10,
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <motion.div
              className="user-icon enduser-icon"
              whileHover={{ rotate: 10, scale: 1.1 }}
            >
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
            </motion.div>
            <h3>End Users</h3>
            <p>
              Verify medicine authenticity, check supply chain history, and
              ensure medication safety.
            </p>
            <motion.div whileHover={{ x: 5 }} className="link-container">
              <Link to="/solutions/endusers" className="user-type-link">
                Learn more →
              </Link>
            </motion.div>

            {/* Interactive particles */}
            <div className="card-particles">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="card-particle"
                  animate={{
                    x: [0, Math.random() * 30 - 15],
                    y: [0, Math.random() * 30 - 15],
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section
        className="testimonials-section"
        ref={(el) => (sectionsRef.current[4] = el)}
      >
        <div className="section-header">
          <motion.span
            className="section-badge"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Trusted by Industry Leaders
          </motion.h2>
          <motion.p
            className="section-description"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            Hear what our users have to say about FarmaTech
          </motion.p>
        </div>

        <div className="testimonials-container">
          <AnimatePresence>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className={`testimonial-card tilt-card ${
                  index === activeTestimonial ? "active" : "inactive"
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: index === activeTestimonial ? 1 : 0,
                  scale: index === activeTestimonial ? 1 : 0.8,
                  x:
                    index === activeTestimonial
                      ? 0
                      : index < activeTestimonial
                      ? -100
                      : 100,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                whileHover={{
                  scale: 1.03,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
              >
                <div className="testimonial-quote">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {testimonial.quote}
                  </motion.span>
                </div>
                <motion.div
                  className="testimonial-author"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.div
                    className="author-avatar"
                    style={{ backgroundColor: testimonial.color }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.position}</p>
                  </div>
                </motion.div>

                <div className="quote-mark quote-mark-start">"</div>
                <div className="quote-mark quote-mark-end">"</div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Testimonial navigation */}
          <div className="testimonial-nav">
            {testimonials.map((_, index) => (
              <motion.button
                key={index}
                className={index === activeTestimonial ? "active" : ""}
                onClick={() => setActiveTestimonial(index)}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
                animate={
                  index === activeTestimonial
                    ? {
                        scale: [1, 1.2, 1],
                        transition: {
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="testimonial-buttons">
            <motion.button
              className="prev-btn"
              onClick={() =>
                setActiveTestimonial(
                  (prev) =>
                    (prev - 1 + testimonials.length) % testimonials.length
                )
              }
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Previous testimonial"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>
            <motion.button
              className="next-btn"
              onClick={() =>
                setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
              }
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Next testimonial"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Enhanced Call To Action with parallax effect */}
      <section
        className="cta-section"
        ref={(el) => (sectionsRef.current[5] = el)}
      >
        <motion.div
          className="cta-bg-shapes"
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.span
            className="section-badge"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Get Started
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Join the FarmaTech Network
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Be part of the solution to ensure pharmaceutical safety and
            integrity. Start securing your supply chain today.
          </motion.p>

          <motion.div
            className="cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ y: -5, scale: 1.03 }}
              whileTap={{ y: 2, scale: 0.98 }}
            >
              <Link to="/register" className="cta-button">
                <span>Create Account</span>
                <span className="btn-glow"></span>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.03 }}
              whileTap={{ y: 2, scale: 0.98 }}
            >
              <Link to="/demo" className="cta-secondary">
                Schedule Demo
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="trusted-by"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            viewport={{ once: true }}
          >
            <span>Trusted by:</span>
            <div className="trusted-logos">
              {["PharmaCorp", "MediTrust", "HealthGuard", "SafeMeds"].map(
                (company, index) => (
                  <motion.div
                    key={index}
                    className="logo"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{
                      scale: 1.1,
                      rotate: 3,
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {company}
                  </motion.div>
                )
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Floating particles in CTA section */}
        <div className="cta-particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="cta-particle"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * 300,
                opacity: 0.3 + Math.random() * 0.5,
                scale: 0.5 + Math.random() * 1,
              }}
              animate={{
                y: [
                  Math.random() * 300,
                  Math.random() * 300 - 150,
                  Math.random() * 300,
                ],
                x: [
                  Math.random() * window.innerWidth,
                  Math.random() * window.innerWidth - 100,
                  Math.random() * window.innerWidth,
                ],
                rotate: [0, 180, 360],
                opacity: [
                  0.3 + Math.random() * 0.5,
                  0.5 + Math.random() * 0.3,
                  0.3 + Math.random() * 0.5,
                ],
              }}
              transition={{
                duration: 15 + Math.random() * 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      </section>

      <motion.div
        className="theme-toggle"
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </motion.div>

      <Footer />
    </div>
  );
};

export default Home;

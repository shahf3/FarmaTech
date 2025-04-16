import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/AboutUs.css";
import Header from "./Header";
import Footer from "./Footer";

const AboutUs = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTeamMember, setActiveTeamMember] = useState(0);
  const [activeTechCard, setActiveTechCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const sectionsRef = useRef([]);
  const shapesRef = useRef([]);
  const aboutHeroRef = useRef(null);

  // Team members data
  const teamMembers = [
    {
      name: "Faizan Ali Shah",
      role: "Co-Founder",
      email: "shahfaizan2425@gmail.com",
      linkedin: "https://www.linkedin.com/in/shahf3/",
      bio: "Computer science student and full-stack developer with an experience of building full stack projects. New to blockchain technology and currently exploring its applications in healthcare through hands-on development at FarmaTech.",
      photo: "/faizan-profile.jpg",
    },
    {
      name: "Abhijit Mahal",
      role: "Co-Founder",
      email: "abhijit.mahal2@mail.dcu.ie",
      linkedin: "https://www.linkedin.com/in/abhijit-mahal/",
      bio: "Full-stack developer and computer science student with a growing interest in blockchain. Gained experience by developing multiple projects, applying and learning new blockchain skills to healthcare challenges.",
      photo: "/abhijit-profile.jpg",
    },
  ];

  // Statistics about counterfeit medicines
  const stats = [
    {
      value: "10-30%",
      description: "of medicines in developing countries are counterfeit",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    },
    {
      value: "$200B+",
      description: "annual losses due to counterfeit pharmaceuticals",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
    },
    {
      value: "1M+",
      description: "deaths yearly linked to fake medicines",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
    },
  ];

  // Technology cards data
  const techCards = [
    {
      title: "Encrypted QR Codes",
      description:
        "Unique digital certificates that store essential medicine information",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      info: "Our QR code technology embeds tamper-proof certificates with encrypted medicine data including batch numbers, production dates, and manufacturer details. When scanned, these codes provide instant verification and full traceability history.",
    },
    {
      title: "Geolocation Tracking",
      description: "Real-time location monitoring throughout the supply chain",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      ),
      info: "Our solution tracks medicines from manufacturer to patient with precise geolocation data at every transfer point. This helps identify potential diversions, ensures proper storage conditions during transit, and provides complete chain-of-custody documentation.",
    },
    {
      title: "Smart Contracts",
      description: "Automated processes that flag issues and ensure compliance",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
          <line x1="6" y1="6" x2="6.01" y2="6"></line>
          <line x1="6" y1="18" x2="6.01" y2="18"></line>
        </svg>
      ),
      info: "Our blockchain-based smart contracts automatically execute critical processes like verifying proper handling, authenticating handoffs, and flagging anomalies. These self-executing programs eliminate manual errors and ensure all parties adhere to regulatory requirements.",
    },
    {
      title: "Role-Based Access",
      description: "Granular security permissions for different user types",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      info: "Our security architecture assigns specific permissions based on user roles - manufacturers can register products, distributors can update tracking information, regulators can access audit trails, and consumers can verify authenticity, all within a secure permissioned framework.",
    },
    {
      title: "Immutable Records",
      description: "Tamper-proof documentation of every transaction and update",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
      ),
      info: "Our blockchain foundation creates permanent, unalterable records of every medicine's journey. Once information is recorded, it cannot be modified, deleted, or tampered with, creating an indisputable audit trail for regulatory compliance and providing absolute confidence in medicine provenance.",
    },
  ];

  useEffect(() => {
    // Simulating page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    // Marking sections for reveal animations
    const sections = document.querySelectorAll(".about-section");
    sections.forEach((section) => {
      section.classList.add("reveal");
    });

    document
      .querySelectorAll(
        ".stat-box, .founder-card, .solution-card, .tech-card, .vision-item"
      )
      .forEach((item) => {
        item.classList.add("reveal");
      });

    // Event listeners
    window.addEventListener("scroll", handleScrollAnimations);
    initTiltEffect();

    // Cleanup
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScrollAnimations);

      document.querySelectorAll(".tilt-card").forEach((card) => {
        card.removeEventListener("mousemove", handleTiltMove);
        card.removeEventListener("mouseleave", handleTiltReset);
      });
    };
  }, []);

  // Team member interval
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTeamMember((prev) => (prev + 1) % teamMembers.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleScrollAnimations = () => {
    setIsScrolled(window.scrollY > 50);

    // Reveal animations as user scrolls
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

    // Parallax for background shapes
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

    // Hero section parallax
    if (aboutHeroRef.current) {
      const heroSpeed = 0.4;
      aboutHeroRef.current.style.backgroundPositionY = `${
        scrollPosition * heroSpeed
      }px`;
    }
  };

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

  // Loading screen component
  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader-circle"></div>
        <div className="loader-text">Loading FarmaTech</div>
      </div>
    );
  }

  return (
    <div className="about-container">
      <Header isScrolled={isScrolled} />

      {/* Animated background */}
      <div className="animated-bg">
        <motion.div
          className="shape shape-1"
          ref={(el) => (shapesRef.current[0] = el)}
          initial={{ opacity: 0, scale: 0.5, x: -100 }}
          animate={{ opacity: 0.8, scale: 1, x: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <motion.div
          className="shape shape-2"
          ref={(el) => (shapesRef.current[1] = el)}
          initial={{ opacity: 0, scale: 0.5, x: 100 }}
          animate={{ opacity: 0.6, scale: 1, x: 0 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        />
        <motion.div
          className="shape shape-3"
          ref={(el) => (shapesRef.current[2] = el)}
          initial={{ opacity: 0, scale: 0.5, y: 100 }}
          animate={{ opacity: 0.5, scale: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="shape shape-4"
          initial={{ opacity: 0, scale: 0.5, y: -100 }}
          animate={{ opacity: 0.4, scale: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
        />
      </div>

      {/* Hero Section */}
      <section className="about-hero" ref={aboutHeroRef}>
        <div className="hero-bg-elements">
          <div className="star-field">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="star"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * 400,
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
        </div>

        <motion.div
          className="about-hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="hero-badge"
          >
            <span className="badge-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            Our Story
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            About <span className="highlight">FarmaTech</span>
          </motion.h1>

          <motion.div
            className="about-hero-divider"
            initial={{ width: 0 }}
            animate={{ width: "80px" }}
            transition={{ delay: 0.8, duration: 0.6 }}
          ></motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
          >
            Building a safer pharmaceutical supply chain with blockchain
            technology
          </motion.p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section
        className="about-section mission-section"
        ref={(el) => (sectionsRef.current[0] = el)}
      >
        <div className="about-section-container">
          <div className="about-section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Our Mission
            </motion.h2>
            <motion.div
              className="section-divider"
              initial={{ width: 0 }}
              whileInView={{ width: "60px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            ></motion.div>
          </div>
          <div className="about-section-content">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              At FarmaTech, our mission is to combat counterfeit medicines
              through blockchain technology, ensuring that every patient
              receives genuine, safe, and effective medication. We are committed
              to creating a transparent pharmaceutical supply chain that
              benefits manufacturers, distributors, regulatory bodies, and most
              importantly, patients.
            </motion.p>

            <motion.div
              className="mission-values"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="value-item">
                <div className="value-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3>Transparency</h3>
                <p>
                  We believe in making the entire medicine supply chain visible
                  to all stakeholders
                </p>
              </div>

              <div className="value-item">
                <div className="value-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
                <h3>Security</h3>
                <p>
                  We prioritize data integrity and protection at every step of
                  the verification process
                </p>
              </div>

              <div className="value-item">
                <div className="value-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <h3>Accountability</h3>
                <p>
                  We hold all participants in the supply chain responsible for
                  medication integrity
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="about-section team-section">
        <div className="about-section-container">
          <div className="about-section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Who We Are
            </motion.h2>
            <motion.div
              className="section-divider"
              initial={{ width: 0 }}
              whileInView={{ width: "60px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            ></motion.div>
          </div>
          <div className="about-section-content">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              FarmaTech was founded by Faizan Ali Shah and Abhijit Mahal,
              technology innovators with a passion for applying cutting-edge
              solutions to critical healthcare challenges. Our team combines
              expertise in blockchain technology, pharmaceutical supply chain
              management, and regulatory compliance to create a revolutionary
              system that addresses one of the most pressing issues in global
              healthcare today.
            </motion.p>

            <div className="team-slider">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  className="founder-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.2,
                  }}
                  viewport={{ once: true }}
                >
                  <motion.div
                    className="founder-photo"
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                    }}
                  >
                    <img src={member.photo} alt={member.name} />
                  </motion.div>

                  <h3>{member.name}</h3>

                  <p className="founder-role">{member.role}</p>

                  <p className="founder-bio">{member.bio}</p>

                  <p className="founder-id">{member.email}</p>

                  <div className="founder-social">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="linkedin-link"
                      onClick={(e) => {
                        e.preventDefault(); // Prevent default link behavior
                        window.open(
                          member.linkedin,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      <span>Connect on LinkedIn</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section
        className="about-section problem-section"
        ref={(el) => (sectionsRef.current[2] = el)}
      >
        <div className="about-section-container">
          <div className="about-section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              The Counterfeit Medicine Crisis
            </motion.h2>
            <motion.div
              className="section-divider"
              initial={{ width: 0 }}
              whileInView={{ width: "60px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            ></motion.div>
          </div>
          <div className="about-section-content">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Counterfeit medicines pose a serious threat to public health
              worldwide. These fake products may contain incorrect dosages,
              harmful ingredients, or no active ingredients at all. According to
              global health authorities, counterfeit drugs contribute to
              thousands of deaths annually and undermine trust in healthcare
              systems.
            </motion.p>

            <div className="stats-container">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="stat-box tilt-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{
                    y: -10,
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <motion.div
                    className="stat-icon"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    {stat.icon}
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.2 }}
                    viewport={{ once: true }}
                    className="stat-value"
                  >
                    {stat.value}
                  </motion.h3>
                  <p>{stat.description}</p>

                  <div className="stat-pulse"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section
        className="about-section solution-section"
        ref={(el) => (sectionsRef.current[3] = el)}
      >
        <div className="about-section-container">
          <div className="about-section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Our Solution
            </motion.h2>
            <motion.div
              className="section-divider"
              initial={{ width: 0 }}
              whileInView={{ width: "60px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            ></motion.div>
          </div>
          <div className="about-section-content">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              FarmaTech has developed a blockchain-based web application that
              creates an immutable, transparent record of a medicine's journey
              from manufacturer to consumer. Our system enables:
            </motion.p>

            <div className="solutions-grid">
              <motion.div
                className="solution-card tilt-card"
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
                  className="solution-icon manufacturer-icon"
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
                <h3>For Manufacturers</h3>
                <ul>
                  <li>
                    Secure medicine registration with unique digital identities
                  </li>
                  <li>Automated QR code generation for each product</li>
                  <li>
                    Real-time visibility of products throughout the supply chain
                  </li>
                </ul>

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
                className="solution-card tilt-card"
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
                  className="solution-icon distributor-icon"
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
                <h3>For Distributors</h3>
                <ul>
                  <li>
                    Quick and reliable verification of medicine authenticity
                  </li>
                  <li>Streamlined supply chain updates via QR scanning</li>
                  <li>Enhanced compliance with regulatory requirements</li>
                </ul>

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
                className="solution-card tilt-card"
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
                  className="solution-icon regulator-icon"
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
                <h3>For Regulators</h3>
                <ul>
                  <li>
                    Complete audit trails for investigation and compliance
                  </li>
                  <li>
                    Real-time monitoring of the pharmaceutical supply chain
                  </li>
                  <li>
                    Tools to quickly identify and address counterfeit incidents
                  </li>
                </ul>

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
                className="solution-card tilt-card"
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
                  className="solution-icon enduser-icon"
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
                <h3>For End Users</h3>
                <ul>
                  <li>Simple QR code scanning to verify medicine legitimacy</li>
                  <li>Access to comprehensive information about medications</li>
                  <li>
                    Immediate alerts about expired products or supply chain
                    issues
                  </li>
                </ul>

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
          </div>
        </div>
      </section>

      {/* Technology Section with Interactive Cards */}
      <section
        className="about-section tech-section"
        ref={(el) => (sectionsRef.current[4] = el)}
      >
        <div className="about-section-container">
          <div className="about-section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Our Technology
            </motion.h2>
            <motion.div
              className="section-divider"
              initial={{ width: 0 }}
              whileInView={{ width: "60px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            ></motion.div>
          </div>
          <div className="about-section-content">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              FarmaTech leverages Hyperledger Fabric, a permissioned blockchain
              framework, to create a secure and scalable platform for medicine
              tracking. Our technology includes:
            </motion.p>

            <div className="tech-grid">
              {techCards.map((tech, index) => (
                <motion.div
                  key={index}
                  className={`tech-card tilt-card ${
                    activeTechCard === index ? "active" : ""
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{
                    y: -10,
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                  onClick={() =>
                    setActiveTechCard(activeTechCard === index ? null : index)
                  }
                >
                  <motion.div
                    className="tech-icon"
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    {tech.icon}
                  </motion.div>
                  <h3>{tech.title}</h3>
                  <p>{tech.description}</p>

                  <motion.div
                    className="tech-info"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: activeTechCard === index ? "auto" : 0,
                      opacity: activeTechCard === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{tech.info}</p>
                  </motion.div>

                  <div className="learn-more">
                    {activeTechCard === index ? "Show less" : "Learn more"}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section
        className="about-section vision-section"
        ref={(el) => (sectionsRef.current[5] = el)}
      >
        <div className="about-section-container">
          <div className="about-section-header">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              Our Vision
            </motion.h2>
            <motion.div
              className="section-divider"
              initial={{ width: 0 }}
              whileInView={{ width: "60px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true, margin: "-100px" }}
            ></motion.div>
          </div>
          <div className="about-section-content">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              We envision a future where patients can trust that their
              medications are genuine, effective, and safe. By creating
              transparency in the pharmaceutical supply chain, FarmaTech aims
              to:
            </motion.p>

            <div className="vision-list">
              {[
                "Eliminate counterfeit medicines from the market",
                "Save lives by ensuring medication integrity",
                "Restore trust in the pharmaceutical supply chain",
                "Support regulatory compliance across the industry",
                "Empower consumers with knowledge about their medications",
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="vision-item"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                  viewport={{ once: true }}
                  whileHover={{
                    x: 10,
                    boxShadow:
                      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <motion.div
                    className="vision-icon"
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
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </motion.div>
                  <p>{item}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="future-roadmap"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>Our Roadmap</h3>
              <div className="roadmap-container">
                <div className="roadmap-line"></div>
                <div className="roadmap-items">
                  <div className="roadmap-item completed">
                    <div className="roadmap-point"></div>
                    <div className="roadmap-content">
                      <h4>Phase 1: Project Planning</h4>
                      <p>
                        Initial planning, brainstorming, and laying the
                        foundation for the platform's architecture and feature
                        set.
                      </p>
                      <div className="roadmap-date">Completed</div>
                    </div>
                  </div>

                  <div className="roadmap-item completed">
                    <div className="roadmap-point"></div>
                    <div className="roadmap-content">
                      <h4>Phase 2: Core Development</h4>
                      <p>
                        Built the entire web application with a full-stack
                        approach, covering both frontend and backend
                        functionalities.
                      </p>
                      <div className="roadmap-date">Completed</div>
                    </div>
                  </div>

                  <div className="roadmap-item active">
                    <div className="roadmap-point"></div>
                    <div className="roadmap-content">
                      <h4>Phase 3: UI & Design Refinement</h4>
                      <p>
                        Focused on improving the user interface and enhancing
                        the overall look and feel of the web application.
                      </p>
                      <div className="roadmap-date">Completed</div>
                    </div>
                  </div>

                  <div className="roadmap-item">
                    <div className="roadmap-point"></div>
                    <div className="roadmap-content">
                      <h4>Phase 4: Testing & Documentation</h4>
                      <p>
                        Conducting rigorous testing across the platform and
                        preparing technical and user documentation.
                      </p>
                      <div className="roadmap-date">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section
        className="cta-section"
        ref={(el) => (sectionsRef.current[6] = el)}
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
              {["PharmaCorp", "MedIrish", "HSE", "DCU"].map(
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
          {[...Array(15)].map((_, i) => (
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

export default AboutUs;
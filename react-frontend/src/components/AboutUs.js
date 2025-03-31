// src/components/AboutUs.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/AboutUs.css";
import Header from "./Header";
import Footer from "./Footer";

const AboutUs = () => {
  return (
    <div className="about-container">
      <div className="animated-bg">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <Header />
      <div className="header-spacer"></div>

      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About FarmaTech</h1>
          <div className="about-hero-divider"></div>
          <p>
            Building a safer pharmaceutical supply chain with blockchain technology
          </p>
        </div>
      </section>

      <section className="about-section mission-section">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2>Our Mission</h2>
            <div className="section-divider"></div>
          </div>
          <div className="about-section-content">
            <p>
              At FarmaTech, our mission is to combat counterfeit medicines through blockchain 
              technology, ensuring that every patient receives genuine, safe, and effective medication. 
              We are committed to creating a transparent pharmaceutical supply chain that benefits 
              manufacturers, distributors, regulatory bodies, and most importantly, patients.
            </p>
          </div>
        </div>
      </section>

  
      <section className="about-section team-section">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2>Who We Are</h2>
            <div className="section-divider"></div>
          </div>
          <div className="about-section-content">
            <p>
              FarmaTech was founded by Faizan Ali Shah and Abhjit Mahal, technology innovators 
              with a passion for applying cutting-edge solutions to critical healthcare challenges. 
              Our team combines expertise in blockchain technology, pharmaceutical supply chain 
              management, and regulatory compliance to create a revolutionary system that addresses 
              one of the most pressing issues in global healthcare today.
            </p>
            <div className="founders-container">
              <div className="founder-card">
                <div className="founder-photo founder-1"></div>
                <h3>Faizan Ali Shah</h3>
                <p>Co-Founder</p>
                <p className="founder-id">Student ID: 21319001</p>
              </div>
              <div className="founder-card">
                <div className="founder-photo founder-2"></div>
                <h3>Abhjit Mahal</h3>
                <p>Co-Founder</p>
                <p className="founder-id">Student ID: 21375106</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section problem-section">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2>The Counterfeit Medicine Crisis</h2>
            <div className="section-divider"></div>
          </div>
          <div className="about-section-content">
            <p>
              Counterfeit medicines pose a serious threat to public health worldwide. These fake 
              products may contain incorrect dosages, harmful ingredients, or no active ingredients 
              at all. According to global health authorities, counterfeit drugs contribute to thousands 
              of deaths annually and undermine trust in healthcare systems.
            </p>
            <div className="stats-container">
              <div className="stat-box">
                <h3>10-30%</h3>
                <p>of medicines in developing countries are counterfeit</p>
              </div>
              <div className="stat-box">
                <h3>$200B+</h3>
                <p>annual losses due to counterfeit pharmaceuticals</p>
              </div>
              <div className="stat-box">
                <h3>1M+</h3>
                <p>deaths yearly linked to fake medicines</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section solution-section">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2>Our Solution</h2>
            <div className="section-divider"></div>
          </div>
          <div className="about-section-content">
            <p>
              FarmaTech has developed a blockchain-based web application that creates an immutable, 
              transparent record of a medicine's journey from manufacturer to consumer. Our system enables:
            </p>
            <div className="solutions-grid">
              <div className="solution-card">
                <div className="solution-icon manufacturer-icon">
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
                <h3>For Manufacturers</h3>
                <ul>
                  <li>Secure medicine registration with unique digital identities</li>
                  <li>Automated QR code generation for each product</li>
                  <li>Real-time visibility of products throughout the supply chain</li>
                </ul>
              </div>
              <div className="solution-card">
                <div className="solution-icon distributor-icon">
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
                <h3>For Distributors</h3>
                <ul>
                  <li>Quick and reliable verification of medicine authenticity</li>
                  <li>Streamlined supply chain updates via QR scanning</li>
                  <li>Enhanced compliance with regulatory requirements</li>
                </ul>
              </div>
              <div className="solution-card">
                <div className="solution-icon regulator-icon">
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
                <h3>For Regulators</h3>
                <ul>
                  <li>Complete audit trails for investigation and compliance</li>
                  <li>Real-time monitoring of the pharmaceutical supply chain</li>
                  <li>Tools to quickly identify and address counterfeit incidents</li>
                </ul>
              </div>
              <div className="solution-card">
                <div className="solution-icon enduser-icon">
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
                <h3>For End Users</h3>
                <ul>
                  <li>Simple QR code scanning to verify medicine legitimacy</li>
                  <li>Access to comprehensive information about medications</li>
                  <li>Immediate alerts about expired products or supply chain issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section tech-section">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2>Our Technology</h2>
            <div className="section-divider"></div>
          </div>
          <div className="about-section-content">
            <p>
              FarmaTech leverages Hyperledger Fabric, a permissioned blockchain framework, to create a 
              secure and scalable platform for medicine tracking. Our technology includes:
            </p>
            <div className="tech-grid">
              <div className="tech-card">
                <div className="tech-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h3>Encrypted QR Codes</h3>
                <p>Unique digital certificates that store essential medicine information</p>
              </div>
              <div className="tech-card">
                <div className="tech-icon">
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
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                </div>
                <h3>Geolocation Tracking</h3>
                <p>Real-time location monitoring throughout the supply chain</p>
              </div>
              <div className="tech-card">
                <div className="tech-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                </div>
                <h3>Smart Contracts</h3>
                <p>Automated processes that flag issues and ensure compliance</p>
              </div>
              <div className="tech-card">
                <div className="tech-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3>Role-Based Access</h3>
                <p>Granular security permissions for different user types</p>
              </div>
              <div className="tech-card">
                <div className="tech-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <h3>Immutable Records</h3>
                <p>Tamper-proof documentation of every transaction and update</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section vision-section">
        <div className="about-section-container">
          <div className="about-section-header">
            <h2>Our Vision</h2>
            <div className="section-divider"></div>
          </div>
          <div className="about-section-content">
            <p>
              We envision a future where patients can trust that their medications are genuine, 
              effective, and safe. By creating transparency in the pharmaceutical supply chain, 
              FarmaTech aims to:
            </p>
            <div className="vision-list">
              <div className="vision-item">
                <div className="vision-icon">
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
                </div>
                <p>Eliminate counterfeit medicines from the market</p>
              </div>
              <div className="vision-item">
                <div className="vision-icon">
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
                </div>
                <p>Save lives by ensuring medication integrity</p>
              </div>
              <div className="vision-item">
                <div className="vision-icon">
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
                </div>
                <p>Restore trust in the pharmaceutical supply chain</p>
              </div>
              <div className="vision-item">
                <div className="vision-icon">
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
                </div>
                <p>Support regulatory compliance across the industry</p>
              </div>
              <div className="vision-item">
                <div className="vision-icon">
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
                </div>
                <p>Empower consumers with knowledge about their medications</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

export default AboutUs;
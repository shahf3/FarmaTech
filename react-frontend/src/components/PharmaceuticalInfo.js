import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/PharmaceuticalInfo.css";

const PharmaceuticalInfo = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });

    return () => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="page-container">
      <Header />
      
      <div className="pharma-info-container">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="animated-title">Secure Pharmaceutical Verification</h1>
            <div className="pill-badge">Blockchain-Powered</div>
            <h3>Verify the authenticity and trace medications through our secure supply chain platform</h3>
            <button className="cta-button">
              Verify Your Medication <i className="material-icons">qr_code_scanner</i>
            </button>
          </div>
          <div className="hero-graphic">
            <div className="floating-icon icon-1">
              <i className="material-icons">verified</i>
            </div>
            <div className="floating-icon icon-2">
              <i className="material-icons">security</i>
            </div>
            <div className="floating-icon icon-3">
              <i className="material-icons">health_and_safety</i>
            </div>
          </div>
        </section>

        <section className="info-section">
          <div className="info-card animate-on-scroll">
            <div className="card-header">
              <div className="icon-bubble">
                <i className="material-icons">qr_code_scanner</i>
              </div>
              <h2>How It Works</h2>
            </div>
            
            <p>
              Our system uses secure QR codes to track and verify medicines at every step of the supply chain, 
              from manufacturer to patient. Each medication has a unique digital identity stored on a secure blockchain, 
              ensuring instant counterfeit detection.
            </p>
            
            <ul className="feature-list">
              <li className="feature-item">
                <i className="material-icons">qr_code_scanner</i>
                <span>Scan the QR code on your medication package</span>
              </li>
              <li className="feature-item">
                <i className="material-icons">verified</i>
                <span>Instantly verify its authenticity and origin</span>
              </li>
              <li className="feature-item">
                <i className="material-icons">timeline</i>
                <span>View complete supply chain history</span>
              </li>
              <li className="feature-item">
                <i className="material-icons">security</i>
                <span>Confirm regulatory compliance</span>
              </li>
            </ul>
          </div>

          <div className="info-card animate-on-scroll">
            <div className="card-header">
              <div className="icon-bubble">
                <i className="material-icons">health_and_safety</i>
              </div>
              <h2>Benefits of Verification</h2>
            </div>
            
            <p>
              Counterfeit medicines can contain harmful ingredients, wrong dosages, or no active ingredients at all. 
              By verifying your medication, you ensure it's safe, effective, and properly handled throughout the supply chain.
            </p>
            
            <div className="info-box">
              <div className="info-box-title">
                <i className="material-icons">warning_amber</i>
                <strong>Did you know?</strong>
              </div>
              <p>
                According to the World Health Organization, an estimated 1 in 10 medical products in low and middle-income 
                countries is substandard or falsified, putting patients at risk and contributing to antimicrobial resistance.
              </p>
            </div>
          </div>
        </section>

        <section className="features-section">
          <h2 className="section-title animate-on-scroll">Key Features</h2>
          
          <div className="features-grid">
            <div className="feature-card animate-on-scroll">
              <div className="icon-wrapper">
                <i className="material-icons">verified</i>
              </div>
              <h3>Instant Authentication</h3>
              <p>Verify the authenticity of medications in seconds with our secure scanning technology.</p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="icon-wrapper">
                <i className="material-icons">timeline</i>
              </div>
              <h3>Complete Traceability</h3>
              <p>Track the complete journey of medicines from manufacturer to end user with detailed timestamps.</p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="icon-wrapper">
                <i className="material-icons">block</i>
              </div>
              <h3>Tamper-Proof Records</h3>
              <p>All supply chain data is secured with blockchain technology, making it impossible to alter.</p>
            </div>
            
            <div className="feature-card animate-on-scroll">
              <div className="icon-wrapper">
                <i className="material-icons">storage</i>
              </div>
              <h3>Regulatory Compliance</h3>
              <p>Ensure all medications meet current regulatory requirements and standards.</p>
            </div>
          </div>
        </section>

        <section className="supply-chain-section">
          <h2 className="section-title animate-on-scroll">The Pharmaceutical Supply Chain</h2>
          
          <p className="animate-on-scroll">
            The pharmaceutical supply chain is a complex network of organizations, activities, and resources that 
            move a medicine from manufacturer to patient. Each step in this journey is critical to ensure the safety, 
            efficacy, and integrity of medicines.
          </p>
          
          <div className="journey-section">
            <h3 className="animate-on-scroll">The Journey of a Medicine</h3>
            
            <div className="journey-timeline">
              <div className="step-item animate-on-scroll">
                <div className="step-connector"></div>
                <div className="step-icon" style={{ backgroundColor: "#4caf50" }}>
                  <i className="material-icons">factory</i>
                </div>
                <div className="step-content">
                  <h4>Manufactured</h4>
                  <p>The medicine is produced under strict quality control measures by a certified pharmaceutical manufacturer.</p>
                </div>
              </div>
              
              <div className="step-item animate-on-scroll">
                <div className="step-connector"></div>
                <div className="step-icon" style={{ backgroundColor: "#fb8c00" }}>
                  <i className="material-icons">check_circle_outline</i>
                </div>
                <div className="step-content">
                  <h4>Quality Check</h4>
                  <p>Multiple quality assurance tests are performed to ensure the medicine meets all safety and efficacy standards.</p>
                </div>
              </div>
              
              <div className="step-item animate-on-scroll">
                <div className="step-connector"></div>
                <div className="step-icon" style={{ backgroundColor: "#3f51b5" }}>
                  <i className="material-icons">local_shipping</i>
                </div>
                <div className="step-content">
                  <h4>Dispatched</h4>
                  <p>After passing quality checks, the medicine is packaged and prepared for distribution.</p>
                </div>
              </div>
              
              <div className="step-item animate-on-scroll">
                <div className="step-connector"></div>
                <div className="step-icon" style={{ backgroundColor: "#00acc1" }}>
                  <i className="material-icons">storage</i>
                </div>
                <div className="step-content">
                  <h4>Distributor</h4>
                  <p>Wholesale distributors receive, store, and prepare the medicines for delivery to pharmacies and healthcare facilities.</p>
                </div>
              </div>
              
              <div className="step-item animate-on-scroll">
                <div className="step-connector"></div>
                <div className="step-icon" style={{ backgroundColor: "#7cb342" }}>
                  <i className="material-icons">admin_panel_settings</i>
                </div>
                <div className="step-content">
                  <h4>Regulator</h4>
                  <p>Regulatory authorities verify, inspect, and ensure compliance of medicines before they reach pharmacies and patients.</p>
                </div>
              </div>
              
              <div className="step-item animate-on-scroll">
                <div className="step-connector"></div>
                <div className="step-icon" style={{ backgroundColor: "#26a69a" }}>
                  <i className="material-icons">medication</i>
                </div>
                <div className="step-content">
                  <h4>Pharmacy</h4>
                  <p>Pharmacies receive the medicines and dispense them to patients based on prescriptions.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="info-box blue animate-on-scroll">
            <h3>Why Supply Chain Verification Matters</h3>
            <p>A secure supply chain ensures that medicines:</p>
            
            <div className="benefits-grid">
              <div className="benefit-list">
                <div className="benefit-item">
                  <i className="material-icons">check_circle_outline</i>
                  <span>Have not been tampered with or contaminated</span>
                </div>
                <div className="benefit-item">
                  <i className="material-icons">check_circle_outline</i>
                  <span>Contain the correct ingredients in the right amounts</span>
                </div>
                <div className="benefit-item">
                  <i className="material-icons">check_circle_outline</i>
                  <span>Have been stored under proper conditions</span>
                </div>
              </div>
              <div className="benefit-list">
                <div className="benefit-item">
                  <i className="material-icons">check_circle_outline</i>
                  <span>Have not expired or degraded</span>
                </div>
                <div className="benefit-item">
                  <i className="material-icons">check_circle_outline</i>
                  <span>Come from legitimate, authorized sources</span>
                </div>
                <div className="benefit-item">
                  <i className="material-icons">check_circle_outline</i>
                  <span>Meet all regulatory requirements</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="call-to-action animate-on-scroll">
            <h3>Ready to verify your medication?</h3>
            <button className="cta-button">
              Get Started <i className="material-icons">arrow_forward</i>
            </button>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
};

export default PharmaceuticalInfo;
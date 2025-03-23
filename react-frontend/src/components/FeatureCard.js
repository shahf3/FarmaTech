// src/components/FeatureCard.js
import React from "react";

const FeatureCard = ({ icon, title, description, active, onClick }) => {
  return (
    <div 
      className={`feature-card ${active ? "active" : ""}`}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px'
      }}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default FeatureCard;
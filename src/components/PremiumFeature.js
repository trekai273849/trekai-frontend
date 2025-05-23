// src/components/PremiumFeature.js
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkSubscriptionAccess } from '../utils/subscription';
import '../styles/PremiumFeature.css';

const PremiumFeature = ({ children, fallback }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAccess = async () => {
      const result = await checkSubscriptionAccess();
      setSubscription(result);
      setLoading(false);
    };
    
    checkAccess();
  }, []);
  
  if (loading) {
    return (
      <div className="premium-feature-loading">
        <div className="spinner-sm"></div>
        <span>Checking subscription...</span>
      </div>
    );
  }
  
  // If user is premium, show the children
  if (subscription.isPremium) {
    return children;
  }
  
  // If a custom fallback is provided, use it
  if (fallback) {
    return fallback;
  }
  
  // Default premium upgrade prompt
  return (
    <div className="premium-feature-container">
      <div className="premium-upgrade-card">
        <div className="premium-badge">
          <svg viewBox="0 0 24 24" className="premium-icon">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5L12 1zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          <span>Premium Feature</span>
        </div>
        <h3>Upgrade to Access</h3>
        <p>This feature is available exclusively to Premium subscribers.</p>
        <div className="premium-features-list">
          <div className="feature-item">
            <svg viewBox="0 0 24 24" className="feature-icon">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Unlimited itinerary generation</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24" className="feature-icon">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Unlimited saved itineraries</span>
          </div>
          <div className="feature-item">
            <svg viewBox="0 0 24 24" className="feature-icon">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
            <span>Premium route recommendations</span>
          </div>
        </div>
        <div className="premium-action-buttons">
          <Link to="/subscription/plans" className="premium-upgrade-button">
            Upgrade Now
          </Link>
          <button 
            className="premium-back-button"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeature;
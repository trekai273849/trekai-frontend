// src/pages/SubscriptionCancel.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/SubscriptionResult.css';

const SubscriptionCancel = () => {
  return (
    <div className="subscription-result-container">
      <div className="result-card neutral">
        <div className="result-icon neutral-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
          </svg>
        </div>
        <h1>Subscription Canceled</h1>
        <p>You've canceled the subscription process.</p>
        <div className="cancel-message">
          <p>You can subscribe at any time to unlock all premium features:</p>
          <ul className="feature-list">
            <li>Unlimited itinerary generation</li>
            <li>Unlimited saved itineraries</li>
            <li>Priority support</li>
            <li>Offline maps access</li>
            <li>Premium route recommendations</li>
          </ul>
        </div>
        <div className="action-links">
          <Link to="/subscription/plans" className="primary-button">
            View Plans
          </Link>
          <Link to="/dashboard" className="secondary-button">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancel;
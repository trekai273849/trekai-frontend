// src/pages/SubscriptionSuccess.js
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/SubscriptionResult.css';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Verify the session was successful
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          setError('Invalid session');
          setLoading(false);
          return;
        }
        
        // Fetch current subscription status
        const response = await fetch('/api/subscriptions/current', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to verify subscription status');
        }
        
        const data = await response.json();
        setSubscription(data);
        setLoading(false);
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError('Failed to verify subscription status. Please check your account page for details.');
        setLoading(false);
      }
    };
    
    verifySession();
  }, [searchParams]);
  
  if (loading) {
    return (
      <div className="subscription-result-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Confirming your subscription...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="subscription-result-container">
        <div className="result-card error">
          <div className="result-icon error-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h1>Subscription Error</h1>
          <p>{error}</p>
          <div className="action-links">
            <Link to="/subscription/plans" className="primary-button">
              Try Again
            </Link>
            <Link to="/dashboard" className="secondary-button">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="subscription-result-container">
      <div className="result-card success">
        <div className="result-icon success-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h1>Subscription Successful!</h1>
        <p>Thank you for subscribing to Smart Trails Pro!</p>
        <div className="subscription-info">
          <p>Your account has been upgraded and you now have access to all premium features:</p>
          <ul className="feature-list">
            <li>Unlimited itinerary generation</li>
            <li>Unlimited saved itineraries</li>
            <li>Priority support</li>
            <li>Offline maps access</li>
            <li>Premium route recommendations</li>
          </ul>
          {subscription && (
            <div className="current-plan">
              <p>
                <strong>Current Plan:</strong> Premium ({subscription.billingInterval === 'year' ? 'Annual' : 'Monthly'})
              </p>
              <p>
                <strong>Next Billing Date:</strong> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        <div className="action-links">
          <Link to="/my-itineraries" className="primary-button">
            View My Itineraries
          </Link>
          <Link to="/dashboard" className="secondary-button">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
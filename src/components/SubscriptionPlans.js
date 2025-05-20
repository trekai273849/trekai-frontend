// src/components/SubscriptionPlans.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import stripePromise from '../utils/stripe';
import '../styles/SubscriptionPlans.css';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscriptions/plans', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        
        const data = await response.json();
        setPlans(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlans();
  }, []);
  
  const handleSubscribe = async (priceId) => {
    try {
      const stripe = await stripePromise;
      
      // Get the checkout session
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          priceId,
          billingInterval
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const session = await response.json();
      
      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      } else {
        // Fallback if we get a session ID but no URL
        const result = await stripe.redirectToCheckout({
          sessionId: session.sessionId,
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError(error.message || 'Failed to start checkout process. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="subscription-plans-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading subscription plans...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="subscription-plans-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="subscription-plans-container">
      <div className="subscription-header">
        <h1>Choose Your Perfect Plan</h1>
        <p>Select the plan that best fits your trekking adventure needs</p>
      </div>
      
      {/* Billing interval toggle */}
      <div className="billing-toggle-container">
        <div className="billing-toggle">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`toggle-button ${billingInterval === 'monthly' ? 'active' : ''}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`toggle-button ${billingInterval === 'annual' ? 'active' : ''}`}
          >
            Annual
            {plans && plans.pro && plans.pro.prices.annual.savings && (
              <span className="savings-badge">Save {plans.pro.prices.annual.savings}</span>
            )}
          </button>
        </div>
        <p className="billing-info">
          {billingInterval === 'annual' ? 'Save with annual billing' : 'Billed monthly, cancel anytime'}
        </p>
      </div>
      
      <div className="plans-container">
        {plans && Object.entries(plans).map(([key, plan]) => {
          const currentPrice = plan.prices[billingInterval];
          return (
            <div 
              key={key}
              className={`plan-card ${key === 'pro' ? 'premium-plan' : 'basic-plan'}`}
            >
              {key === 'pro' && <div className="plan-badge">Most Popular</div>}
              
              <div className="plan-header">
                <h2>{plan.name}</h2>
                <p className="plan-description">{plan.description}</p>
                <div className="plan-price">
                  <span className="price-amount">${currentPrice.price}</span>
                  <span className="price-period">/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {key === 'pro' && billingInterval === 'annual' && (
                  <p className="save-text">Save {plan.prices.annual.saveAmount} per year</p>
                )}
              </div>
              
              <div className="plan-features">
                <h3>Features</h3>
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <svg viewBox="0 0 24 24" className="feature-icon">
                        <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={() => handleSubscribe(currentPrice.id)}
                className={`subscribe-button ${key === 'pro' ? 'primary' : 'secondary'}`}
                disabled={key === 'basic' && currentPrice.price === 0}
              >
                {key === 'basic' && currentPrice.price === 0 ? 'Free Tier' : 'Subscribe Now'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
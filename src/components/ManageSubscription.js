// src/components/ManageSubscription.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManageSubscription.css';

const ManageSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/subscriptions/current', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription');
        }
        
        const data = await response.json();
        setSubscription(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Failed to load subscription details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
  }, []);
  
  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      const data = await response.json();
      
      // Refresh subscription data
      const subResponse = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!subResponse.ok) {
        throw new Error('Failed to refresh subscription data');
      }
      
      const subData = await subResponse.json();
      setSubscription(subData);
      setConfirmCancel(false);
      
      // Show a temporary success message
      alert(data.message);
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError('Failed to cancel subscription. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }
      
      // Refresh subscription data
      const subResponse = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      const subData = await subResponse.json();
      setSubscription(subData);
      
      // Show a temporary success message
      alert('Your subscription has been reactivated successfully.');
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      setError('Failed to reactivate subscription. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subscriptions/customer-portal?returnUrl=${window.location.origin}/account`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }
      
      const data = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      setError('Failed to open billing portal. Please try again later.');
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  if (loading && !subscription) {
    return (
      <div className="manage-subscription-container">
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }
  
  if (error && !subscription) {
    return (
      <div className="manage-subscription-container">
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
    <div className="manage-subscription-container">
      <div className="subscription-header">
        <h1>Subscription Management</h1>
        <p>Manage your Smart Trails subscription details</p>
      </div>
      
      <div className="subscription-details">
        <div className="subscription-card">
          <div className="card-header">
            <h2>Current Plan</h2>
            <div className={`status-badge ${subscription?.status === 'premium' ? 'premium' : 'free'}`}>
              {subscription?.status === 'premium' ? 'Premium' : 'Free'}
            </div>
          </div>
          
          <div className="card-content">
            {subscription?.status === 'premium' ? (
              <>
                <div className="detail-row">
                  <div className="detail-label">Billing</div>
                  <div className="detail-value">
                    {subscription.billingInterval === 'year' ? 'Annual' : 'Monthly'}
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Started</div>
                  <div className="detail-value">{formatDate(subscription.startDate)}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Current Period Ends</div>
                  <div className="detail-value">
                    {formatDate(subscription.currentPeriodEnd || subscription.endDate)}
                  </div>
                </div>
                
                {subscription.cancelAtPeriodEnd && (
                  <div className="cancellation-notice">
                    <svg className="notice-icon" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <p>
                      Your subscription will end on {formatDate(subscription.currentPeriodEnd || subscription.endDate)}.
                      You will not be billed again.
                    </p>
                  </div>
                )}
                
                <div className="action-buttons">
                  {subscription.cancelAtPeriodEnd ? (
                    <button 
                      className="primary-button"
                      onClick={handleReactivateSubscription}
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Reactivate Subscription'}
                    </button>
                  ) : (
                    <>
                      {confirmCancel ? (
                        <div className="confirm-cancel">
                          <p>Are you sure you want to cancel your subscription?</p>
                          <div className="confirm-buttons">
                            <button 
                              className="cancel-confirm-button"
                              onClick={handleCancelSubscription}
                              disabled={loading}
                            >
                              {loading ? 'Processing...' : 'Yes, Cancel'}
                            </button>
                            <button 
                              className="cancel-decline-button"
                              onClick={() => setConfirmCancel(false)}
                              disabled={loading}
                            >
                              No, Keep Subscription
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="cancel-button"
                          onClick={() => setConfirmCancel(true)}
                          disabled={loading}
                        >
                          Cancel Subscription
                        </button>
                      )}
                    </>
                  )}
                  
                  <button 
                    className="secondary-button"
                    onClick={openCustomerPortal}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Manage Billing'}
                  </button>
                </div>
              </>
            ) : (
              <div className="free-tier-content">
                <p>You are currently on the free plan.</p>
                <p>Upgrade to unlock all premium features:</p>
                <ul className="premium-features">
                  <li>Unlimited itinerary generation</li>
                  <li>Unlimited saved itineraries</li>
                  <li>Priority support</li>
                  <li>Offline maps access</li>
                  <li>Premium route recommendations</li>
                </ul>
                <button 
                  className="primary-button upgrade-button"
                  onClick={() => navigate('/subscription/plans')}
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSubscription;